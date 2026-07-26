import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "@/lib/auth-helpers";
import type { DefaultSession } from "next-auth";

// Extender los tipos de session para incluir rol y estado de 2FA
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
      totpVerified: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    rol: string;
    totpEnabled: boolean;
    totpVerified?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await verifyCredentials(
          credentials.email as string,
          credentials.password as string
        );

        if (result.error || !result.agente) return null;

        const agente = result.agente;
        return {
          id: agente.id,
          name: `${agente.nombre} ${agente.apellido}`,
          email: agente.email,
          rol: agente.rol,
          totpEnabled: agente.totpEnabled,
          // 2FA no verificado todavía — se completa en /admin/verificar-2fa
          totpVerified: false,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
    updateAge: 30 * 60,  // renovar token cada 30 min de actividad
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
        token.totpEnabled = user.totpEnabled;
        token.totpVerified = user.totpVerified ?? false;
      }
      // Resetear verificación 2FA si la sesión se actualiza manualmente
      if (trigger === "update" && token.totpVerified === true) {
        token.totpVerified = true;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.rol = token.rol as string;
      session.user.totpVerified = token.totpVerified as boolean;
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
});
