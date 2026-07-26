import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { campos } from "./campos";

// ─── Padrones ─────────────────────────────────────────────────────────────────

export const padrones = pgTable("padrones", {
  id: uuid("id").defaultRandom().primaryKey(),
  campoId: uuid("campo_id")
    .notNull()
    .references(() => campos.id, { onDelete: "cascade" }),
  numeroPadron: varchar("numero_padron", { length: 30 }).notNull(),
  departamento: varchar("departamento", { length: 50 }),
  superficieHa: numeric("superficie_ha", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Desglose CONEAT ──────────────────────────────────────────────────────────

export const desgloseConeat = pgTable("desglose_coneat", {
  id: uuid("id").defaultRandom().primaryKey(),
  campoId: uuid("campo_id")
    .notNull()
    .references(() => campos.id, { onDelete: "cascade" }),
  grupoSuelo: varchar("grupo_suelo", { length: 20 }).notNull(),
  indice: numeric("indice", { precision: 6, scale: 2 }).notNull(),
  hectareas: numeric("hectareas", { precision: 10, scale: 2 }).notNull(),
});

// ─── Fuentes de agua ──────────────────────────────────────────────────────────

export const tipoFuenteAguaEnum = pgEnum("tipo_fuente_agua", [
  "arroyo",
  "canada",
  "frente_rio",
  "tajamar",
  "represa",
  "pozo_semisurgente",
  "pozo_surgente",
  "molino",
  "bomba",
  "bebedero",
]);

export const estadoEnum = pgEnum("estado_mejora", [
  "nuevo",
  "bueno",
  "regular",
  "a_reparar",
]);

export const fuentesAgua = pgTable("fuentes_agua", {
  id: uuid("id").defaultRandom().primaryKey(),
  campoId: uuid("campo_id")
    .notNull()
    .references(() => campos.id, { onDelete: "cascade" }),
  tipo: tipoFuenteAguaEnum("tipo").notNull(),
  cantidad: integer("cantidad").default(1),
  estado: estadoEnum("estado"),
  observaciones: text("observaciones"),
});

// ─── Mejoras / Infraestructura ────────────────────────────────────────────────

export const tipoMejoraEnum = pgEnum("tipo_mejora", [
  "casco",
  "casa_personal",
  "galpon",
  "silo",
  "balanza",
  "brete",
  "corral",
  "tubo",
  "manga",
  "banadera",
  "sala_ordene",
  "otro",
]);

export const mejoras = pgTable("mejoras", {
  id: uuid("id").defaultRandom().primaryKey(),
  campoId: uuid("campo_id")
    .notNull()
    .references(() => campos.id, { onDelete: "cascade" }),
  tipo: tipoMejoraEnum("tipo").notNull(),
  superficieM2: numeric("superficie_m2", { precision: 8, scale: 2 }),
  estado: estadoEnum("estado"),
  descripcion: text("descripcion"),
  antiguedadAnios: integer("antiguedad_anios"),
});

// ─── Media ────────────────────────────────────────────────────────────────────

export const tipoMediaEnum = pgEnum("tipo_media", [
  "foto",
  "foto_drone",
  "video",
  "video_drone",
  "pdf",
]);

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  campoId: uuid("campo_id")
    .notNull()
    .references(() => campos.id, { onDelete: "cascade" }),
  tipo: tipoMediaEnum("tipo").notNull(),
  // URL del CDN (R2/S3) — nunca la URL de origen directa
  url: text("url").notNull(),
  urlThumb: text("url_thumb"),
  // Alt text para accesibilidad
  altText: varchar("alt_text", { length: 255 }),
  orden: integer("orden").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Historial de precios ─────────────────────────────────────────────────────

export const historialPrecios = pgTable("historial_precios", {
  id: uuid("id").defaultRandom().primaryKey(),
  campoId: uuid("campo_id")
    .notNull()
    .references(() => campos.id, { onDelete: "cascade" }),
  precioVentaUsd: numeric("precio_venta_usd", { precision: 14, scale: 2 }),
  precioUsdHa: numeric("precio_usd_ha", { precision: 12, scale: 2 }),
  rentaArrendamientoUsdHaAnio: numeric("renta_arrendamiento_usd_ha_anio", {
    precision: 10,
    scale: 2,
  }),
  // quién realizó el cambio
  modificadoPor: uuid("modificado_por"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
