import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { agentes } from "./agentes";

export const tipoContenidoEnum = pgEnum("tipo_contenido", [
  "informe_mercado",
  "articulo",
  "guia",
]);

export const contenidos = pgTable("contenidos", {
  id: uuid("id").defaultRandom().primaryKey(),
  tipo: tipoContenidoEnum("tipo").notNull(),
  titulo: varchar("titulo", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 350 }).notNull().unique(),
  extracto: text("extracto"),
  cuerpo: text("cuerpo").notNull(),
  // Imagen destacada — URL CDN
  imagenDestacada: text("imagen_destacada"),
  publicado: boolean("publicado").notNull().default(false),
  autorId: uuid("autor_id").references(() => agentes.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
});
