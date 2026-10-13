-- centro_publico es el punto que se sirve al público cuando
-- precision_ubicacion = 'aproximada'. Se calcula UNA SOLA VEZ por geometría
-- (vía trigger, no en la capa de aplicación) desplazando el centroide real
-- una distancia y azimut aleatorios dentro del radio de aproximación.
--
-- Por qué en un trigger y no al leer: si el desplazamiento se recalculara en
-- cada lectura, pedir la ficha pública muchas veces y promediar los puntos
-- devueltos convergería hacia el centroide real, anulando la privacidad.
-- Al persistirlo una vez, el mismo punto se sirve siempre y el promedio de
-- muchas lecturas no revela nada nuevo.
--
-- No se modela con Drizzle (requiere lógica condicional en BEFORE INSERT/UPDATE,
-- no soportado como columna generada) — aplicar a mano una vez por entorno con:
--   psql "$DATABASE_URL" -f src/db/sql/centro_publico_offset.sql

CREATE OR REPLACE FUNCTION fn_actualizar_centro_publico()
RETURNS trigger AS $$
BEGIN
  IF NEW.precision_ubicacion = 'aproximada' AND NEW.centroide IS NOT NULL THEN
    -- Solo recalcular cuando cambió la geometría real, cambió el modo de
    -- precisión, o todavía no hay punto público — nunca en cada UPDATE,
    -- para no generar un nuevo offset en cada guardado del formulario.
    IF TG_OP = 'INSERT'
       OR OLD.centroide IS DISTINCT FROM NEW.centroide
       OR OLD.precision_ubicacion IS DISTINCT FROM NEW.precision_ubicacion
       OR NEW.centro_publico IS NULL THEN
      -- Distancia aleatoria entre 20% y 70% del radio: el punto real queda
      -- dentro del círculo mostrado, pero el centro no coincide ni con el
      -- centroide real ni con el borde del círculo.
      NEW.centro_publico := ST_SetSRID(
        ST_Project(
          NEW.centroide::geography,
          COALESCE(NEW.radio_aproximacion_m, 3000) * (0.2 + random() * 0.5),
          radians(random() * 360)
        )::geometry,
        4326
      );
    END IF;
  ELSE
    NEW.centro_publico := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_centro_publico ON campos;

CREATE TRIGGER trg_centro_publico
  BEFORE INSERT OR UPDATE ON campos
  FOR EACH ROW
  EXECUTE FUNCTION fn_actualizar_centro_publico();

CREATE INDEX IF NOT EXISTS idx_campos_centro_publico ON campos USING GIST (centro_publico);
