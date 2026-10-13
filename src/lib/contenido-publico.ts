import { db } from "@/db";
import { contenidos } from "@/db/schema/contenido";
import { agentes } from "@/db/schema/agentes";
import { and, eq, desc, sql } from "drizzle-orm";

export const TIPO_CONTENIDO_LABEL: Record<string, string> = {
  informe_mercado: "Informe de mercado",
  articulo: "Artículo",
  guia: "Guía",
};

export type ContenidoResumen = {
  id: string;
  tipo: string;
  titulo: string;
  slug: string;
  extracto: string | null;
  imagenDestacada: string | null;
  publishedAt: Date | null;
};

export type ContenidoDetalle = ContenidoResumen & {
  cuerpo: string;
  autorNombre: string | null;
};

const RESUMEN_COLUMNS = {
  id: contenidos.id,
  tipo: contenidos.tipo,
  titulo: contenidos.titulo,
  slug: contenidos.slug,
  extracto: contenidos.extracto,
  imagenDestacada: contenidos.imagenDestacada,
  publishedAt: contenidos.publishedAt,
};

export async function getContenidosPublicados(limit?: number): Promise<ContenidoResumen[]> {
  const base = db
    .select(RESUMEN_COLUMNS)
    .from(contenidos)
    .where(eq(contenidos.publicado, true))
    .orderBy(desc(contenidos.publishedAt));

  return limit ? await base.limit(limit) : await base;
}

export async function getContenidoPorSlug(slug: string): Promise<ContenidoDetalle | null> {
  const [row] = await db
    .select({
      ...RESUMEN_COLUMNS,
      cuerpo: contenidos.cuerpo,
      autorNombre: sql<string | null>`trim(coalesce(${agentes.nombre}, '') || ' ' || coalesce(${agentes.apellido}, ''))`,
    })
    .from(contenidos)
    .leftJoin(agentes, eq(contenidos.autorId, agentes.id))
    .where(and(eq(contenidos.slug, slug), eq(contenidos.publicado, true)));

  if (!row) return null;
  return { ...row, autorNombre: row.autorNombre?.trim() || null };
}
