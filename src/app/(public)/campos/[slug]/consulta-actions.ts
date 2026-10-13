"use server";

import { db } from "@/db";
import { consultas } from "@/db/schema/consultas";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { getClientIp } from "@/lib/request-meta";
import {
  consultaSchema,
  CONSENTIMIENTO_TEXTO,
  CONSENTIMIENTO_VERSION,
} from "@/lib/validation/consulta";

export type CrearConsultaResult = { ok: true } | { error: string };

// FormData.get() devuelve null para campos ausentes — Zod .optional() solo
// trata undefined como "no provisto", así que normalizamos acá.
function str(v: FormDataEntryValue | null): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export async function crearConsulta(formData: FormData): Promise<CrearConsultaResult> {
  // Honeypot: si el campo oculto viene con valor, es un bot. Devolvemos
  // éxito falso sin persistir nada, para no delatar la trampa.
  const honeypot = formData.get("website");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { ok: true };
  }

  const ip = await getClientIp();

  const allowed = checkRateLimit(`consulta:${ip}`, {
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

  const parsed = consultaSchema.safeParse({
    campoId: str(formData.get("campoId")),
    nombre: str(formData.get("nombre")),
    email: str(formData.get("email")),
    telefono: str(formData.get("telefono")),
    mensaje: str(formData.get("mensaje")),
    consentimientoMarketing: formData.get("consentimientoMarketing") === "on",
    utmSource: str(formData.get("utmSource")),
    utmMedium: str(formData.get("utmMedium")),
    utmCampaign: str(formData.get("utmCampaign")),
    referrer: str(formData.get("referrer")),
  });

  if (!parsed.success) {
    return { error: "Revisá los datos del formulario e intentá de nuevo." };
  }

  const data = parsed.data;

  try {
    await db.insert(consultas).values({
      campoId: data.campoId,
      nombre: data.nombre,
      email: data.email ?? null,
      telefono: data.telefono,
      mensaje: data.mensaje ?? null,
      canal: "formulario",
      consentimientoTexto: CONSENTIMIENTO_TEXTO,
      consentimientoVersion: CONSENTIMIENTO_VERSION,
      consentimientoMarketing: data.consentimientoMarketing,
      utmSource: data.utmSource ?? null,
      utmMedium: data.utmMedium ?? null,
      utmCampaign: data.utmCampaign ?? null,
      referrer: data.referrer ?? null,
    });
  } catch (err) {
    console.error("[crearConsulta]", err);
    return { error: "No pudimos enviar tu consulta. Intentá de nuevo en unos minutos." };
  }

  return { ok: true };
}
