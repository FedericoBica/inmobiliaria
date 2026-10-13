-- log_auditoria es un log de auditoría inmutable: ni un bug en la app ni un
-- acceso directo a la base pueden alterar o borrar filas ya escritas.
-- No se modela con Drizzle (no soporta RULEs) — se aplica a mano una vez
-- por entorno con: psql "$DATABASE_URL" -f src/db/sql/log_auditoria_immutable.sql

DROP RULE IF EXISTS log_auditoria_no_update ON log_auditoria;
DROP RULE IF EXISTS log_auditoria_no_delete ON log_auditoria;

CREATE RULE log_auditoria_no_update AS ON UPDATE TO log_auditoria DO INSTEAD NOTHING;
CREATE RULE log_auditoria_no_delete AS ON DELETE TO log_auditoria DO INSTEAD NOTHING;
