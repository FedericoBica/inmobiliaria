import { z } from "zod";

// v2: el formulario de consulta ya no muestra casilla de consentimiento —
// el registro deja constancia de que no hubo aceptación explícita.
export const CONSENTIMIENTO_VERSION = "v2";
export const CONSENTIMIENTO_TEXTO =
  "Sin casilla de consentimiento: datos enviados por el usuario para que se responda su consulta.";

export const consultaSchema = z.object({
  campoId: z.string().uuid(),
  nombre: z.string().trim().min(2).max(100),
  email: z
    .union([z.literal(""), z.string().trim().email()])
    .optional()
    .transform((v) => (v ? v : undefined)),
  telefono: z.string().trim().min(6).max(30),
  mensaje: z.string().trim().max(2000).optional().transform((v) => (v ? v : undefined)),
  consentimientoMarketing: z.boolean().optional().default(false),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(100).optional(),
  referrer: z.string().trim().max(500).optional(),
});

export type ConsultaInput = z.infer<typeof consultaSchema>;
