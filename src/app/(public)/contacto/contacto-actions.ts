"use server";

import { db } from "@/db";
import { consultas } from "@/db/schema/consultas";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { getClientIp } from "@/lib/request-meta";
import {
  contactoSchema,
  CONSENTIMIENTO_CONTACTO_TEXTO,
  CONSENTIMIENTO_CONTACTO_VERSION,
} from "@/lib/validation/contacto";

export type CrearContactoResult = { ok: true } | { error: string };

function str(v: FormDataEntryValue | null): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export async function crearContactoGeneral(formData: FormData): Promise<CrearContactoResult> {
  // Honeypot: igual criterio que consulta-actions.ts — éxito falso, sin
  // persistir nada, para no delatar la trampa a quien la complete.
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { ok: true };
  }

  const ip = await getClientIp();

  const allowed = checkRateLimit(`contacto:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) {
    return { error: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }

  const turnstileToken = formData.get("turnstileToken");
  const turnstileOk = await verifyTurnstile(
    typeof turnstileToken === "string" ? turnstileToken : null,
    ip
  );
  if (!turnstileOk) {
    return { error: "No pudimos verificar que sos una persona. Intentá de nuevo." };
  }

  const parsed = contactoSchema.safeParse({
    nombre: str(formData.get("nombre")),
    email: str(formData.get("email")),
    telefono: str(formData.get("telefono")),
    mensaje: str(formData.get("mensaje")),
    consentimiento: formData.get("consentimiento") === "on",
    consentimientoMarketing: formData.get("consentimientoMarketing") === "on",
  });

  if (!parsed.success) {
    return { error: "Revisá los datos del formulario e intentá de nuevo." };
  }

  const data = parsed.data;

  try {
    await db.insert(consultas).values({
      campoId: null,
      nombre: data.nombre,
      email: data.email ?? null,
      telefono: data.telefono,
      mensaje: data.mensaje,
      canal: "formulario",
      consentimientoTexto: CONSENTIMIENTO_CONTACTO_TEXTO,
      consentimientoVersion: CONSENTIMIENTO_CONTACTO_VERSION,
      consentimientoMarketing: data.consentimientoMarketing,
    });
  } catch (err) {
    console.error("[crearContactoGeneral]", err);
    return { error: "No pudimos enviar tu mensaje. Intentá de nuevo en unos minutos." };
  }

  return { ok: true };
}
