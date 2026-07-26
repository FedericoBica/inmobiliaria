import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  customType,
} from "drizzle-orm/pg-core";
import { agentes } from "./agentes";

// PostGIS geometry type — stored as WKT/WKB, handled by PostGIS functions
const geometry = customType<{ data: string }>({
  dataType() {
    return "geometry(MultiPolygon, 4326)";
  },
});

const point = customType<{ data: string }>({
  dataType() {
    return "geometry(Point, 4326)";
  },
});

// ─── Enums ───────────────────────────────────────────────────────────────────

export const departamentoEnum = pgEnum("departamento", [
  "artigas",
  "canelones",
  "cerro_largo",
  "colonia",
  "durazno",
  "flores",
  "florida",
  "lavalleja",
  "maldonado",
  "montevideo",
  "paysandu",
  "rio_negro",
  "rivera",
  "rocha",
  "salto",
  "san_jose",
  "soriano",
  "tacuarembo",
  "treinta_y_tres",
]);

export const precisionUbicacionEnum = pgEnum("precision_ubicacion", [
  "exacta",
  "aproximada",
  "oculta",
]);

export const estadoPublicacionEnum = pgEnum("estado_publicacion", [
  "borrador",
  "publicado",
  "reservado",
  "vendido",
  "off_market",
]);

export const estadoOcupacionEnum = pgEnum("estado_ocupacion", [
  "libre",
  "arrendado",
  "pastoreo",
  "explotacion_propia",
]);

export const energiaEnum = pgEnum("energia", [
  "en_predio_trifasica",
  "en_predio_monofasica",
  "linea_a_menos_1km",
  "sin_ute",
]);

export const accesoEnum = pgEnum("acceso", [
  "ruta_nacional",
  "camino_departamental_balastro",
  "camino_vecinal",
]);

// ─── Tabla principal: campos ──────────────────────────────────────────────────

export const campos = pgTable("campos", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Identificación
  referenciaInterna: varchar("referencia_interna", { length: 20 })
    .notNull()
    .unique(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  departamento: departamentoEnum("departamento").notNull(),
  paraje: varchar("paraje", { length: 100 }),
  seccionJudicial: varchar("seccion_judicial", { length: 50 }),
  seccionPolicial: varchar("seccion_policial", { length: 50 }),

  // Geometría (PostGIS)
  geometria: geometry("geometria"),
  centroide: point("centroide"),
  precisionUbicacion: precisionUbicacionEnum("precision_ubicacion")
    .notNull()
    .default("oculta"),
  radioAproximacionM: integer("radio_aproximacion_m"),

  // Superficie y suelo
  superficieHa: numeric("superficie_ha", { precision: 10, scale: 2 }).notNull(),
  // coneat_promedio es GENERADO por trigger/función desde desglose_coneat
  coneatPromedio: numeric("coneat_promedio", { precision: 6, scale: 2 }),
  pctPrioridadForestal: numeric("pct_prioridad_forestal", {
    precision: 5,
    scale: 2,
  }),
  haLaborable: numeric("ha_laborable", { precision: 10, scale: 2 }),
  haCampoNatural: numeric("ha_campo_natural", { precision: 10, scale: 2 }),
  haPraderas: numeric("ha_praderas", { precision: 10, scale: 2 }),
  haMonteNativo: numeric("ha_monte_nativo", { precision: 10, scale: 2 }),
  haForestado: numeric("ha_forestado", { precision: 10, scale: 2 }),
  // aptitud es array de texto (multi-select); validado a nivel de aplicación
  aptitud: text("aptitud").array(),
  dotacionHistoricaUgHa: numeric("dotacion_historica_ug_ha", {
    precision: 6,
    scale: 2,
  }),
  // zafra/rendimiento histórico como JSONB flexible
  rendimientosHistoricos: jsonb("rendimientos_historicos"),

  // Infraestructura
  alambradoPerimetralEstado: varchar("alambrado_perimetral_estado", {
    length: 20,
  }),
  alambradoDivisorioEstado: varchar("alambrado_divisorio_estado", {
    length: 20,
  }),
  cantidadPotreros: integer("cantidad_potreros"),
  kmAlambrado: numeric("km_alambrado", { precision: 8, scale: 2 }),
  energia: energiaEnum("energia"),
  acceso: accesoEnum("acceso"),
  accesoTodoTiempo: boolean("acceso_todo_tiempo"),
  kmARuta: numeric("km_a_ruta", { precision: 6, scale: 1 }),
  kmACentroPoblado: numeric("km_a_centro_poblado", { precision: 6, scale: 1 }),
  centroPobladoReferencia: varchar("centro_poblado_referencia", { length: 100 }),

  // Agua (resumen; detalle en fuentes_agua)
  tieneDerechoRiego: boolean("tiene_derecho_riego").default(false),
  padronConPermisoRiego: varchar("padron_con_permiso_riego", { length: 50 }),
  haBajoRiego: numeric("ha_bajo_riego", { precision: 10, scale: 2 }),

  // Comercial
  tipoOperacion: text("tipo_operacion").array().notNull(), // venta|arrendamiento|pastoreo|permuta
  precioVentaUsd: numeric("precio_venta_usd", { precision: 14, scale: 2 }),
  // precio_usd_ha es DERIVADO: precio_venta_usd / superficie_ha — nunca aceptado del formulario
  precioUsdHa: numeric("precio_usd_ha", { precision: 12, scale: 2 }),
  rentaArrendamientoUsdHaAnio: numeric("renta_arrendamiento_usd_ha_anio", {
    precision: 10,
    scale: 2,
  }),
  precioPastoreo: numeric("precio_pastoreo", { precision: 10, scale: 2 }),
  unidadPastoreo: varchar("unidad_pastoreo", { length: 50 }),
  precioAConsultar: boolean("precio_a_consultar").default(false),
  estadoOcupacion: estadoOcupacionEnum("estado_ocupacion"),
  fechaVencimientoContrato: timestamp("fecha_vencimiento_contrato"),
  estadoPublicacion: estadoPublicacionEnum("estado_publicacion")
    .notNull()
    .default("borrador"),
  esExclusiva: boolean("es_exclusiva").default(false),

  // Interno — cifrado a nivel de aplicación antes de persistir
  propietarioContacto: text("propietario_contacto"), // JSON cifrado
  estadoDominial: text("estado_dominial"),
  observacionesJuridicas: text("observaciones_juridicas"),
  comisionPactada: numeric("comision_pactada", { precision: 5, scale: 2 }),
  notasInternas: text("notas_internas"),

  // Metadatos
  agenteId: uuid("agente_id")
    .notNull()
    .references(() => agentes.id),
  destacado: boolean("destacado").notNull().default(false),
  ordenManual: integer("orden_manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  publishedAt: timestamp("published_at"),
});
