import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "@/lib/auth-helpers";
import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Extender los tipos de session para incluir el rol
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
    } & DefaultSession["user"];
  }
  interface User {
    rol: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rol?: string;
    // Identificador único por login — se regenera en cada inicio de sesión
    // (ver callback jwt más abajo) como defensa contra fijación de sesión.
    sid?: string;
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
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    // maxAge funciona como expiración por inactividad bajo estrategia JWT:
    // el token expira a iat + maxAge, y se reemite (iat nuevo) cada vez que
    // pasan updateAge minutos de actividad. Si no hay actividad durante
    // maxAge, el token queda expirado y auth() vuelve a pedir login.
    maxAge: 8 * 60 * 60, // 8 horas de inactividad
    updateAge: 30 * 60,  // renovar token cada 30 min de actividad
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Login nuevo: rotar el identificador de sesión (defensa contra
        // fijación de sesión).
        token.id = user.id;
        token.rol = user.rol;
        token.sid = crypto.randomUUID();
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.rol = token.rol as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
