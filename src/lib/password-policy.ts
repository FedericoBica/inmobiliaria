import { createHash } from "crypto";

const MIN_LENGTH = 12;
const HIBP_TIMEOUT_MS = 3000;

export type PasswordPolicyResult = { ok: true } | { ok: false; error: string };

// Política de contraseñas (spec 11.1): longitud mínima + verificación
// contra listas de credenciales filtradas. Deliberadamente NO exige reglas
// de composición (mayúscula+número+símbolo) — OWASP ASVS y NIST SP 800-63B
// recomiendan abandonarlas porque empujan a patrones predecibles
// ("Campo123!") sin mejorar la seguridad real; longitud + chequeo contra
// filtraciones reales es más efectivo.
export async function validatePasswordPolicy(
  password: string
): Promise<PasswordPolicyResult> {
  if (password.length < MIN_LENGTH) {
    return { ok: false, error: `La contraseña debe tener al menos ${MIN_LENGTH} caracteres` };
  }

  const filtrada = await isPasswordPwned(password);
  if (filtrada) {
    return {
      ok: false,
      error: "Esta contraseña apareció en filtraciones de datos conocidas. Elegí otra.",
    };
  }

  return { ok: true };
}

// API de Have I Been Pwned (Pwned Passwords) con modelo k-anonimato: solo
// se envían los primeros 5 caracteres del hash SHA-1, nunca la contraseña
// ni el hash completo — el servicio no puede reconstruir la contraseña.
async function isPasswordPwned(password: string): Promise<boolean> {
  const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: AbortSignal.timeout(HIBP_TIMEOUT_MS),
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) throw new Error(`HIBP respondió ${res.status}`);

    const body = await res.text();
    return body
      .split("\n")
      .some((line) => line.split(":")[0].trim() === suffix);
  } catch (err) {
    // Si el servicio externo no responde, no bloqueamos la creación de
    // cuentas por una dependencia de terceros caída — se deja pasar y se
    // loguea, en vez de fallar cerrado.
    console.error("[password-policy] No se pudo verificar contra HIBP", err);
    return false;
  }
}
