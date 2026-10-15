import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Host de almacenamiento (R2/S3) permitido en img-src, si está configurado
function storageHost(): string {
  const url = process.env.STORAGE_PUBLIC_URL;
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

const isDev = process.env.NODE_ENV !== "production";

// Dos políticas de script-src:
// - Estricta (backoffice y login): solo scripts con nonce, como exige
//   CLAUDE.md. Next solo pone el nonce en sus scripts cuando la página se
//   renderiza por request, así que estas rutas deben ser dinámicas (ver
//   src/app/(public)/login/layout.tsx).
// - Pública: 'unsafe-inline' sin nonce, para que las páginas públicas sigan
//   siendo estáticas/ISR (performance en conexiones de campo). Con nonce los
//   scripts inline de una página prerenderizada quedan bloqueados y la página
//   no hidrata. Ojo: si hay nonce, el navegador ignora 'unsafe-inline', por
//   eso no se incluye.
function buildCsp(nonce: string, strict: boolean): string {
  const scriptSrc = strict ? `'nonce-${nonce}'` : `'unsafe-inline'`;
  const directives = [
    `default-src 'self'`,
    // Turbopack/Fast Refresh usa eval() en dev para reconstruir stack
    // traces — nunca en producción, así que solo se habilita acá.
    `script-src 'self' ${scriptSrc} https://challenges.cloudflare.com${
      isDev ? " 'unsafe-eval'" : ""
    }`,
    // No hay soporte de nonce para el atributo style="" — el código usa estilos
    // inline en unos pocos componentes decorativos; se acepta unsafe-inline solo acá.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:${storageHost() ? ` ${storageHost()}` : ""}`,
    `font-src 'self'`,
    // El websocket de HMR de Next dev necesita ws:/wss: además de fetch 'self'
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    `frame-src https://challenges.cloudflare.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ];
  return directives.join("; ");
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/login" || pathname === "/admin/login";

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, isAdminRoute || isLoginPage);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  function withSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("x-nonce", nonce);
    return response;
  }

  // Login único — con sesión ya iniciada no tiene sentido mostrarlo
  if (isLoginPage) {
    if (session) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin", req.url)));
    }
    return withSecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } })
    );
  }

  // Sin sesión → redirigir a login
  if (isAdminRoute && !session) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/login", req.url))
    );
  }

  if (isAdminRoute && session) {
    const { rol } = session.user;

    // Control de acceso por rol para rutas específicas (CLAUDE.md, tabla de roles)
    if (pathname.startsWith("/admin/agentes") && rol !== "administrador") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin", req.url)));
    }
    if (pathname.startsWith("/admin/leads") && rol === "editor_contenido") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin", req.url)));
    }
    if (
      pathname.startsWith("/admin/contenido") &&
      !["administrador", "gerente_comercial", "editor_contenido"].includes(rol)
    ) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin", req.url)));
    }
  }

  return withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } })
  );
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
