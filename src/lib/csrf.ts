// Protección CSRF explícita para Route Handlers que modifican estado.
//
// Las Server Actions ("use server") ya están protegidas automáticamente por
// Next.js, que compara el header Origin contra Host/X-Forwarded-Host y
// aborta la request si no coinciden (ver
// node_modules/next/dist/server/app-render/action-handler.js). Los Route
// Handlers (app/api/**/route.ts) NO pasan por ese mecanismo — son HTTP
// endpoints planos — así que replican el mismo chequeo acá.
export function isSameOriginRequest(req: Request): boolean {
  const origin = req.headers.get("origin");
  // En browsers modernos, fetch/form POST same-site siempre manda Origin.
  // Su ausencia en una request que modifica estado es sospechosa.
  if (!origin) return false;

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
