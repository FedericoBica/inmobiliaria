import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { campos } from "@/db/schema/campos";

export type UbicacionPublica =
  | { modo: "exacta"; geometriaGeoJson: string; centroLat: number; centroLng: number }
  | { modo: "aproximada"; centroLat: number; centroLng: number; radioM: number }
  | { modo: "oculta" };

// Única puerta de entrada para exponer ubicación de un campo a páginas
// públicas. La geometría y el centroide reales solo se seleccionan de la
// base cuando precision_ubicacion = 'exacta' — el filtrado ocurre en esta
// query, no ocultando el dato en el cliente (spec sección 6 / CLAUDE.md).
//
// Para 'aproximada' se usa centro_publico, un punto ya desplazado y
// persistido por un trigger de base de datos (ver
// src/db/sql/centro_publico_offset.sql) — nunca se lee ni se deriva el
// centroide real en este camino.
export async function obtenerUbicacionPublica(campoId: string): Promise<UbicacionPublica> {
  const [row] = await db
    .select({
      precisionUbicacion: campos.precisionUbicacion,
      radioAproximacionM: campos.radioAproximacionM,
    })
    .from(campos)
    .where(eq(campos.id, campoId));

  if (!row) return { modo: "oculta" };

  if (row.precisionUbicacion === "exacta") {
    const [geo] = await db
      .select({
        geojson: sql<string | null>`ST_AsGeoJSON(${campos.geometria})`,
        lat: sql<number | null>`ST_Y(${campos.centroide})`,
        lng: sql<number | null>`ST_X(${campos.centroide})`,
      })
      .from(campos)
      .where(eq(campos.id, campoId));

    if (!geo?.geojson || geo.lat == null || geo.lng == null) return { modo: "oculta" };

    return { modo: "exacta", geometriaGeoJson: geo.geojson, centroLat: geo.lat, centroLng: geo.lng };
  }

  if (row.precisionUbicacion === "aproximada") {
    const [geo] = await db
      .select({
        lat: sql<number | null>`ST_Y(${campos.centroPublico})`,
        lng: sql<number | null>`ST_X(${campos.centroPublico})`,
      })
      .from(campos)
      .where(eq(campos.id, campoId));

    // Sin geometría real cargada todavía no hay offset calculado por el
    // trigger — no hay nada seguro para mostrar.
    if (geo?.lat == null || geo?.lng == null) return { modo: "oculta" };

    return {
      modo: "aproximada",
      centroLat: geo.lat,
      centroLng: geo.lng,
      radioM: row.radioAproximacionM ?? 3000,
    };
  }

  return { modo: "oculta" };
}
