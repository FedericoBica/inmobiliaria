import { z } from "zod";

// Texto que el formulario de contacto muestra junto a la casilla obligatoria
export const CONSENTIMIENTO_CONTACTO_VERSION = "v1";
export const CONSENTIMIENTO_CONTACTO_TEXTO =
  "Acepto que mis datos sean usados para responder este mensaje, de acuerdo a la política de privacidad.";

// Contacto general — no está asociado a un campo puntual (a diferencia de
// consultaSchema, que sí lo exige), por eso el mensaje es obligatorio: es
// la única pista de qué necesita la persona.
export const contactoSchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  email: z
    .union([z.literal(""), z.string().trim().email()])
    .optional()
    .transform((v) => (v ? v : undefined)),
  telefono: z.string().trim().min(6).max(30),
  mensaje: z.string().trim().min(5).max(2000),
  consentimiento: z.literal(true, {
    error: "Debés aceptar el uso de tus datos para poder enviar el mensaje.",
  }),
  consentimientoMarketing: z.boolean().optional().default(false),
});

export type ContactoInput = z.infer<typeof contactoSchema>;
