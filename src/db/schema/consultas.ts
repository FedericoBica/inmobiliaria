import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { campos } from "./campos";

export const canalConsultaEnum = pgEnum("canal_consulta", [
  "whatsapp",
  "formulario",
  "telefono",
  "alerta",
  "captacion_oferta",
]);

export const estadoConsultaEnum = pgEnum("estado_consulta", [
  "nueva",
  "contactado",
  "en_negociacion",
  "cerrado_ganado",
  "cerrado_perdido",
  "descartado",
]);

export const consultas = pgTable("consultas", {
  id: uuid("id").defaultRandom().primaryKey(),
  campoId: uuid("campo_id").references(() => campos.id, {
    onDelete: "set null",
  }),

  // Datos del interesado
  nombre: varchar("nombre", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  telefono: varchar("telefono", { length: 30 }),
  mensaje: text("mensaje"),

  // Tracking
  canal: canalConsultaEnum("canal").notNull(),
  estado: estadoConsultaEnum("estado").notNull().default("nueva"),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  referrer: text("referrer"),

  // Consentimiento (obligatorio por Ley 18.331)
  consentimientoTexto: text("consentimiento_texto").notNull(),
  consentimientoMarketing: boolean("consentimiento_marketing")
    .notNull()
    .default(false),
  consentimientoVersion: varchar("consentimiento_version", {
    length: 20,
  }).notNull(),

  // Notas internas del agente
  notasInternas: text("notas_internas"),
  // ID del deal en CRM externo (Pipedrive/HubSpot)
  crmExternalId: varchar("crm_external_id", { length: 100 }),
  // Metadata flexible (ej: descarga de ficha técnica, campos vistos)
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Alertas / búsquedas guardadas ───────────────────────────────────────────

export const alertas = pgTable("alertas", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  telefono: varchar("telefono", { length: 30 }),
  // Criterios de la alerta como JSONB (departamento, aptitud, rango ha, etc.)
  criterios: jsonb("criterios").notNull(),
  // Token único para dar de baja con un clic, sin requerir login
  tokenBaja: varchar("token_baja", { length: 64 }).notNull().unique(),
  activa: boolean("activa").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastNotifiedAt: timestamp("last_notified_at"),
});
