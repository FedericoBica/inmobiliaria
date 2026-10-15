import type { ReactNode } from "react";
import { connection } from "next/server";

// La CSP de src/proxy.ts exige un nonce por request en script-src. Next solo
// agrega ese nonce a sus scripts cuando la página se renderiza por request;
// si se prerenderiza como estática, el navegador bloquea todos los scripts,
// la página no hidrata y el formulario cae al submit nativo (recarga y no
// loguea). connection() fuerza el render dinámico.
export default async function LoginLayout({ children }: { children: ReactNode }) {
  await connection();
  return children;
}
