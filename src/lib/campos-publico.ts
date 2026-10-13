import { db } from "@/db";
import { campos } from "@/db/schema/campos";
import { desgloseConeat, fuentesAgua, mejoras, media } from "@/db/schema/campo-children";
import {
  and,
  desc,
  asc,
  eq,
  gte,
  lte,
  arrayContains,
  arrayOverlaps,
  inArray,
  ne,
  sql,
} from "drizzle-orm";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CampoResumen = {
  id: string;
  referencia: string;
  titulo: string;
  slug: string;
  departamento: string;
  paraje: string | null;
  superficieHa: number;
  coneatPromedio: number | null;
  precioUsdHa: number | null;
  precioVentaUsd: number | null;
  rentaUsdHaAnio: number | null;
  tipoOperacion: string[];
  aptitud: string[];
  esExclusiva: boolean;
  // Thumbnail de la primera foto (por orden) — null si el campo no tiene fotos
  fotoPortadaUrl: string | null;
};

export type CamposListadoFiltros = {
  departamento?: string;
  tipo?: string;
  ha_min?: string;
  ha_max?: string;
  precio_max?: string;
  coneat_min?: string;
  aptitud?: string;
  orden?: string;
};

// Estados visibles en listados/home — nunca borradores, reservados u
// off-market (gestión interna/exclusiva, no pensada para tráfico público).
const ESTADOS_LISTABLES = ["publicado"] as const;
// La ficha individual además acepta reservado/vendido para no romper
// enlaces entrantes (spec 9: nunca 404 en campos vendidos).
const ESTADOS_FICHA = ["publicado", "reservado", "vendido"] as const;

function mapResumen(row: {
  id: string;
  referencia: string;
  titulo: string;
  slug: string;
  departamento: string;
  paraje: string | null;
  superficieHa: string;
  coneatPromedio: string | null;
  precioUsdHa: string | null;
  precioVentaUsd: string | null;
  rentaUsdHaAnio: string | null;
  tipoOperacion: string[] | null;
  aptitud: string[] | null;
  esExclusiva: boolean | null;
  fotoPortadaUrl: string | null;
}): CampoResumen {
  return {
    id: row.id,
    referencia: row.referencia,
    titulo: row.titulo,
    slug: row.slug,
    departamento: row.departamento,
    paraje: row.paraje,
    superficieHa: Number(row.superficieHa),
    coneatPromedio: row.coneatPromedio != null ? Number(row.coneatPromedio) : null,
    precioUsdHa: row.precioUsdHa != null ? Number(row.precioUsdHa) : null,
    precioVentaUsd: row.precioVentaUsd != null ? Number(row.precioVentaUsd) : null,
    rentaUsdHaAnio: row.rentaUsdHaAnio != null ? Number(row.rentaUsdHaAnio) : null,
    tipoOperacion: row.tipoOperacion ?? [],
    aptitud: row.aptitud ?? [],
    esExclusiva: row.esExclusiva ?? false,
    fotoPortadaUrl: row.fotoPortadaUrl,
  };
}

const RESUMEN_COLUMNS = {
  id: campos.id,
  referencia: campos.referenciaInterna,
  titulo: campos.titulo,
  slug: campos.slug,
  departamento: campos.departamento,
  paraje: campos.paraje,
  superficieHa: campos.superficieHa,
  coneatPromedio: campos.coneatPromedio,
  precioUsdHa: campos.precioUsdHa,
  precioVentaUsd: campos.precioVentaUsd,
  rentaUsdHaAnio: campos.rentaArrendamientoUsdHaAnio,
  tipoOperacion: campos.tipoOperacion,
  aptitud: campos.aptitud,
  esExclusiva: campos.esExclusiva,
  // Nombres calificados a mano: en un select de una sola tabla, Drizzle
  // interpola ${campos.id} como "id" a secas, que dentro de la subquery
  // resolvería a media.id.
  fotoPortadaUrl: sql<string | null>`(
    select coalesce(m.url_thumb, m.url) from media m
    where m.campo_id = "campos"."id" and m.tipo in ('foto', 'foto_drone')
    order by m.orden asc
    limit 1
  )`,
};

// ─── Home ─────────────────────────────────────────────────────────────────────

export async function getCamposDestacados(limit = 6): Promise<CampoResumen[]> {
  const rows = await db
    .select(RESUMEN_COLUMNS)
    .from(campos)
    .where(and(inArray(campos.estadoPublicacion, ESTADOS_LISTABLES), eq(campos.destacado, true)))
    .orderBy(asc(campos.ordenManual), desc(campos.publishedAt))
    .limit(limit);
  return rows.map(mapResumen);
}

export async function getUltimosIngresos(limit = 5): Promise<CampoResumen[]> {
  const rows = await db
    .select(RESUMEN_COLUMNS)
    .from(campos)
    .where(inArray(campos.estadoPublicacion, ESTADOS_LISTABLES))
    .orderBy(desc(campos.publishedAt))
    .limit(limit);
  return rows.map(mapResumen);
}

// ─── Listado ──────────────────────────────────────────────────────────────────

export async function getCamposListado(filtros: CamposListadoFiltros): Promise<CampoResumen[]> {
  const condiciones = [inArray(campos.estadoPublicacion, ESTADOS_LISTABLES)];

  if (filtros.departamento) {
    condiciones.push(eq(campos.departamento, filtros.departamento as (typeof campos.departamento.enumValues)[number]));
  }
  if (filtros.tipo) {
    condiciones.push(arrayContains(campos.tipoOperacion, [filtros.tipo]));
  }
  if (filtros.ha_min) {
    condiciones.push(gte(campos.superficieHa, filtros.ha_min));
  }
  if (filtros.ha_max) {
    condiciones.push(lte(campos.superficieHa, filtros.ha_max));
  }
  if (filtros.precio_max) {
    condiciones.push(lte(campos.precioUsdHa, filtros.precio_max));
  }
  if (filtros.coneat_min) {
    condiciones.push(gte(campos.coneatPromedio, filtros.coneat_min));
  }
  if (filtros.aptitud) {
    condiciones.push(arrayOverlaps(campos.aptitud, filtros.aptitud.split(",")));
  }

  const ordenColumna = {
    ha_desc: desc(campos.superficieHa),
    ha_asc: asc(campos.superficieHa),
    precio_asc: asc(campos.precioUsdHa),
    precio_desc: desc(campos.precioUsdHa),
    coneat_desc: desc(campos.coneatPromedio),
    reciente: desc(campos.publishedAt),
  }[filtros.orden ?? "reciente"] ?? desc(campos.publishedAt);

  const rows = await db
    .select(RESUMEN_COLUMNS)
    .from(campos)
    .where(and(...condiciones))
    .orderBy(ordenColumna);

  return rows.map(mapResumen);
}

// ─── Ficha ────────────────────────────────────────────────────────────────────

export type CampoDetalle = CampoResumen & {
  seccionJudicial: string | null;
  seccionPolicial: string | null;
  estadoPublicacion: string;
  estadoOcupacion: string | null;
  precisionUbicacion: "exacta" | "aproximada" | "oculta";
  radioAproximacionM: number | null;
  haLaborable: number | null;
  haCampoNatural: number | null;
  haPraderas: number | null;
  haMonteNativo: number | null;
  haForestado: number | null;
  dotacionHistoricaUgHa: number | null;
  pctPrioridadForestal: number | null;
  alambradoPerimetralEstado: string | null;
  alambradoDivisorioEstado: string | null;
  cantidadPotreros: number | null;
  kmAlambrado: number | null;
  energia: string | null;
  acceso: string | null;
  accesoTodoTiempo: boolean | null;
  kmARuta: number | null;
  kmACentroPoblado: number | null;
  centroPobladoReferencia: string | null;
  tieneDerechoRiego: boolean;
  haBajoRiego: number | null;
  desgloseConeat: { grupoSuelo: string; indice: number; hectareas: number }[];
  fuentesAgua: { tipo: string; cantidad: number; estado: string | null; observaciones: string | null }[];
  mejoras: {
    tipo: string;
    superficieM2: number | null;
    estado: string | null;
    descripcion: string | null;
    antiguedadAnios: number | null;
  }[];
  media: { id: string; tipo: string; url: string; urlThumb: string | null; altText: string | null }[];
};

function n(v: string | null): number | null {
  return v != null ? Number(v) : null;
}

export async function getCampoDetallePorSlug(slug: string): Promise<CampoDetalle | null> {
  const [row] = await db.select().from(campos).where(eq(campos.slug, slug));
  if (!row || !(ESTADOS_FICHA as readonly string[]).includes(row.estadoPublicacion)) return null;

  const [coneatRows, aguaRows, mejoraRows, mediaRows] = await Promise.all([
    db.select().from(desgloseConeat).where(eq(desgloseConeat.campoId, row.id)),
    db.select().from(fuentesAgua).where(eq(fuentesAgua.campoId, row.id)),
    db.select().from(mejoras).where(eq(mejoras.campoId, row.id)),
    db.select().from(media).where(eq(media.campoId, row.id)).orderBy(asc(media.orden)),
  ]);

  return {
    id: row.id,
    referencia: row.referenciaInterna,
    titulo: row.titulo,
    slug: row.slug,
    departamento: row.departamento,
    paraje: row.paraje,
    seccionJudicial: row.seccionJudicial,
    seccionPolicial: row.seccionPolicial,
    superficieHa: Number(row.superficieHa),
    coneatPromedio: n(row.coneatPromedio),
    precioUsdHa: n(row.precioUsdHa),
    precioVentaUsd: n(row.precioVentaUsd),
    rentaUsdHaAnio: n(row.rentaArrendamientoUsdHaAnio),
    tipoOperacion: row.tipoOperacion ?? [],
    aptitud: row.aptitud ?? [],
    esExclusiva: row.esExclusiva ?? false,
    fotoPortadaUrl: (() => {
      const foto = mediaRows.find((m) => m.tipo === "foto" || m.tipo === "foto_drone");
      return foto ? foto.urlThumb ?? foto.url : null;
    })(),
    estadoPublicacion: row.estadoPublicacion,
    estadoOcupacion: row.estadoOcupacion,
    precisionUbicacion: row.precisionUbicacion,
    radioAproximacionM: row.radioAproximacionM,
    haLaborable: n(row.haLaborable),
    haCampoNatural: n(row.haCampoNatural),
    haPraderas: n(row.haPraderas),
    haMonteNativo: n(row.haMonteNativo),
    haForestado: n(row.haForestado),
    dotacionHistoricaUgHa: n(row.dotacionHistoricaUgHa),
    pctPrioridadForestal: n(row.pctPrioridadForestal),
    alambradoPerimetralEstado: row.alambradoPerimetralEstado,
    alambradoDivisorioEstado: row.alambradoDivisorioEstado,
    cantidadPotreros: row.cantidadPotreros,
    kmAlambrado: n(row.kmAlambrado),
    energia: row.energia,
    acceso: row.acceso,
    accesoTodoTiempo: row.accesoTodoTiempo,
    kmARuta: n(row.kmARuta),
    kmACentroPoblado: n(row.kmACentroPoblado),
    centroPobladoReferencia: row.centroPobladoReferencia,
    tieneDerechoRiego: row.tieneDerechoRiego ?? false,
    haBajoRiego: n(row.haBajoRiego),
    desgloseConeat: coneatRows.map((c) => ({
      grupoSuelo: c.grupoSuelo,
      indice: Number(c.indice),
      hectareas: Number(c.hectareas),
    })),
    fuentesAgua: aguaRows.map((f) => ({
      tipo: f.tipo,
      cantidad: f.cantidad ?? 1,
      estado: f.estado,
      observaciones: f.observaciones,
    })),
    mejoras: mejoraRows.map((m) => ({
      tipo: m.tipo,
      superficieM2: n(m.superficieM2),
      estado: m.estado,
      descripcion: m.descripcion,
      antiguedadAnios: m.antiguedadAnios,
    })),
    media: mediaRows.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      url: m.url,
      urlThumb: m.urlThumb,
      altText: m.altText,
    })),
  };
}

// ─── Campos similares ─────────────────────────────────────────────────────────

export async function getCamposSimilares(campoId: string, departamento: string, limit = 3): Promise<CampoResumen[]> {
  const rows = await db
    .select(RESUMEN_COLUMNS)
    .from(campos)
    .where(
      and(
        inArray(campos.estadoPublicacion, ESTADOS_LISTABLES),
        eq(campos.departamento, departamento as (typeof campos.departamento.enumValues)[number]),
        ne(campos.id, campoId)
      )
    )
    .orderBy(desc(campos.publishedAt))
    .limit(limit);
  return rows.map(mapResumen);
}
