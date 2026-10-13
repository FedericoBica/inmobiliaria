// Verificación server-side de Cloudflare Turnstile.
// Si TURNSTILE_SECRET_KEY no está configurada, queda "wired pero inactivo":
// no bloquea el envío (honeypot + rate limiting igual protegen), y se
// activa sola apenas se carga la env var, sin tocar código.

let warnedInactive = false;

export async function verifyTurnstile(
  token: string | null,
  remoteIp?: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (!warnedInactive) {
      console.warn(
        "[turnstile] TURNSTILE_SECRET_KEY no configurada — verificación inactiva."
      );
      warnedInactive = true;
    }
    return true;
  }

  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
    if (!res.ok) return false;

    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] Error al verificar token:", err);
    return false;
  }
}
