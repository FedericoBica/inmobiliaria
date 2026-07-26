import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";
  const isSetup2faPage = pathname === "/admin/setup-2fa";
  const isVerify2faPage = pathname === "/admin/verificar-2fa";

  // Ruta pública del backoffice — no requiere sesión
  if (isLoginPage) return NextResponse.next();

  // Sin sesión → redirigir a login
  if (isAdminRoute && !session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (isAdminRoute && session) {
    const { totpVerified, rol } = session.user as {
      totpVerified: boolean;
      rol: string;
      totpEnabled?: boolean;
    };

    // Permitir setup-2fa y verificar-2fa sin 2FA completado
    if (isSetup2faPage || isVerify2faPage) return NextResponse.next();

    // Si 2FA no está verificado, redirigir a verificación
    if (!totpVerified) {
      return NextResponse.redirect(new URL("/admin/verificar-2fa", req.url));
    }

    // Control de acceso por rol para rutas específicas
    if (pathname.startsWith("/admin/agentes") && rol !== "administrador") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
