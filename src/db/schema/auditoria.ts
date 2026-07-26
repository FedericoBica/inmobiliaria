import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// Log de auditoría inmutable — nunca se actualiza ni se borra
// Registra: quién cambió qué, cuándo, valor anterior y nuevo
export const logAuditoria = pgTable("log_auditoria", {
  id: uuid("id").defaultRandom().primaryKey(),
  // ID del usuario que realizó la acción
  actorId: uuid("actor_id"),
  actorEmail: varchar("actor_email", { length: 255 }),
  // Tabla y registro afectado
  tabla: varchar("tabla", { length: 100 }).notNull(),
  registroId: varchar("registro_id", { length: 100 }).notNull(),
  accion: varchar("accion", { length: 20 }).notNull(), // INSERT | UPDATE | DELETE
  // Snapshot anterior y nuevo (solo campos modificados en UPDATE)
  valorAnterior: jsonb("valor_anterior"),
  valorNuevo: jsonb("valor_nuevo"),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
