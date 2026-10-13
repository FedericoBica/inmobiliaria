import { headers } from "next/headers";

// IP y user-agent del request actual, para rate limiting y auditoría.
// Detrás de Cloudflare/proxy, x-forwarded-for trae la cadena de IPs —
// la primera es la del cliente original.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function getUserAgent(): Promise<string> {
  const h = await headers();
  return h.get("user-agent") ?? "unknown";
}
