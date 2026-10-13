import { headers } from "next/headers";

// El nonce lo genera src/proxy.ts en cada request y lo reenvía como header
// x-nonce. Server Components lo leen acá y lo pasan como prop a los client
// components que necesiten inyectar un <script nonce="...">.
export async function getNonce(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-nonce") ?? undefined;
}
