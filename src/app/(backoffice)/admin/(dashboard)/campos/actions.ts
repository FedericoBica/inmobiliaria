"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { campos } from "@/db/schema/campos";
import {
  padrones,
  desgloseConeat,
  fuentesAgua,
  mejoras,
} from "@/db/schema/campo-children";
import { eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { slugify } from "@/lib/slugify";

// ─── Tipos insert derivados del schema ───────────────────────────────────────

type CampoInsert        = InferInsertModel<typeof campos>;
type FuenteInsert       = InferInsertModel<typeof fuentesAgua>;
type MejoraInsert       = InferInsertModel<typeof mejoras>;

// ─── Tipos del formulario (cliente) ───────────────────────────────────────────

export type ConeatRow = { id?: string; grupoSuelo: string; indice: string; hectareas: string };
export type FuenteRow = { id?: string; tipo: string; cantidad: string; estado: string; observaciones: string };
export type MejoraRow = { id?: string; tipo: string; superficieM2: string; estado: string; descripcion: string; antiguedadAnios: string };
export type PadronRow = { id?: string; numeroPadron: string; departamento: string; superficieHa: string };

export type CampoFormData = {
  referenciaInterna: string;
  titulo: string;
  slug: string;
  departamento: string;
  paraje: string;
  seccionJudicial: string;
  seccionPolicial: string;
  tipoOperacion: string[];
  precioVentaUsd: string;
  precioAConsultar: boolean;
  rentaArrendamientoUsdHaAnio: string;
  precioPastoreo: string;
  unidadPastoreo: string;
  estadoOcupacion: string;
  fechaVencimientoContrato: string;
  esExclusiva: boolean;
  superficieHa: string;
  aptitud: string[];
  dotacionHistoricaUgHa: string;
  pctPrioridadForestal: string;
  haLaborable: string;
  haCampoNatural: string;
  haPraderas: string;
  haMonteNativo: string;
  haForestado: string;
  desgloseConeat: ConeatRow[];
  energia: string;
  acceso: string;
  accesoTodoTiempo: boolean | null;
  kmARuta: string;
  kmACentroPoblado: string;
  centroPobladoReferencia: string;
  cantidadPotreros: string;
  kmAlambrado: string;
  alambradoPerimetralEstado: string;
  alambradoDivisorioEstado: string;
  padrones: PadronRow[];
  tieneDerechoRiego: boolean;
  padronConPermisoRiego: string;
  haBajoRiego: string;
  fuentesAgua: FuenteRow[];
  mejoras: MejoraRow[];
  precisionUbicacion: string;
  radioAproximacionM: string;
  estadoPublicacion: string;
  destacado: boolean;
  notasInternas: string;
  estadoDominial: string;
  observacionesJuridicas: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function n(s: string): string | null { return s.trim() === "" ? null : s.trim(); }
function num(s: string): string | null { const v = parseFloat(s); return isNaN(v) ? null : String(v); }
function int(s: string): number | null { const v = parseInt(s, 10); return isNaN(v) ? null : v; }

function computeConeat(rows: ConeatRow[]): string | null {
  const valid = rows.filter((r) => r.grupoSuelo && r.indice && r.hectareas);
  if (!valid.length) return null;
  const totalHa = valid.reduce((s, r) => s + parseFloat(r.hectareas), 0);
  if (!totalHa) return null;
  const weighted = valid.reduce((s, r) => s + parseFloat(r.indice) * parseFloat(r.hectareas), 0);
  return (weighted / totalHa).toFixed(2);
}

function computePrecioHa(precioVenta: string, superficieHa: string): string | null {
  const pv = parseFloat(precioVenta);
  const ha = parseFloat(superficieHa);
  if (!pv || !ha) return null;
  return (pv / ha).toFixed(2);
}

function buildSlug(data: CampoFormData): string {
  return data.slug.trim()
    ? slugify(data.slug)
    : slugify(`${data.titulo} ${data.referenciaInterna}`);
}

async function getAgenteId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session.user.id;
}

// Convierte el form data en el objeto para Drizzle insert/update
function buildValues(data: CampoFormData, agenteId: string, publishedAt?: Date | null): CampoInsert {
  const coneatPromedio = computeConeat(data.desgloseConeat);
  const precioUsdHa = computePrecioHa(data.precioVentaUsd, data.superficieHa);

  return {
    referenciaInterna: data.referenciaInterna.trim().toUpperCase(),
    titulo: data.titulo.trim(),
    slug: buildSlug(data),
    departamento: data.departamento as CampoInsert["departamento"],
    paraje: n(data.paraje),
    seccionJudicial: n(data.seccionJudicial),
    seccionPolicial: n(data.seccionPolicial),
    tipoOperacion: data.tipoOperacion,
    precioVentaUsd: num(data.precioVentaUsd),
    precioUsdHa,
    precioAConsultar: data.precioAConsultar,
    rentaArrendamientoUsdHaAnio: num(data.rentaArrendamientoUsdHaAnio),
    precioPastoreo: num(data.precioPastoreo),
    unidadPastoreo: n(data.unidadPastoreo),
    estadoOcupacion: (n(data.estadoOcupacion) as CampoInsert["estadoOcupacion"]) ?? null,
    fechaVencimientoContrato: data.fechaVencimientoContrato
      ? new Date(data.fechaVencimientoContrato)
      : null,
    esExclusiva: data.esExclusiva,
    superficieHa: data.superficieHa.trim(),
    coneatPromedio,
    aptitud: data.aptitud.length ? data.aptitud : null,
    dotacionHistoricaUgHa: num(data.dotacionHistoricaUgHa),
    pctPrioridadForestal: num(data.pctPrioridadForestal),
    haLaborable: num(data.haLaborable),
    haCampoNatural: num(data.haCampoNatural),
    haPraderas: num(data.haPraderas),
    haMonteNativo: num(data.haMonteNativo),
    haForestado: num(data.haForestado),
    energia: (n(data.energia) as CampoInsert["energia"]) ?? null,
    acceso: (n(data.acceso) as CampoInsert["acceso"]) ?? null,
    accesoTodoTiempo: data.accesoTodoTiempo,
    kmARuta: num(data.kmARuta),
    kmACentroPoblado: num(data.kmACentroPoblado),
    centroPobladoReferencia: n(data.centroPobladoReferencia),
    cantidadPotreros: int(data.cantidadPotreros),
    kmAlambrado: num(data.kmAlambrado),
    alambradoPerimetralEstado: n(data.alambradoPerimetralEstado),
    alambradoDivisorioEstado: n(data.alambradoDivisorioEstado),
    tieneDerechoRiego: data.tieneDerechoRiego,
    padronConPermisoRiego: n(data.padronConPermisoRiego),
    haBajoRiego: num(data.haBajoRiego),
    precisionUbicacion: (data.precisionUbicacion as CampoInsert["precisionUbicacion"]) ?? "oculta",
    radioAproximacionM: int(data.radioAproximacionM),
    estadoPublicacion: (data.estadoPublicacion as CampoInsert["estadoPublicacion"]) ?? "borrador",
    destacado: data.destacado,
    notasInternas: n(data.notasInternas),
    estadoDominial: n(data.estadoDominial),
    observacionesJuridicas: n(data.observacionesJuridicas),
    agenteId,
    publishedAt: publishedAt,
  };
}

// ─── Crear campo ──────────────────────────────────────────────────────────────

export async function crearCampo(data: CampoFormData): Promise<{ error: string } | void> {
  const agenteId = await getAgenteId();

  if (!data.referenciaInterna.trim()) return { error: "La referencia interna es requerida" };
  if (!data.titulo.trim())            return { error: "El título es requerido" };
  if (!data.departamento)             return { error: "El departamento es requerido" };
  if (!data.superficieHa || isNaN(parseFloat(data.superficieHa)))
    return { error: "La superficie es requerida" };
  if (!data.tipoOperacion.length)     return { error: "Seleccioná al menos un tipo de operación" };

  const publishedAt = data.estadoPublicacion === "publicado" ? new Date() : null;
  const values = buildValues(data, agenteId, publishedAt);

  try {
    const [campo] = await db.insert(campos).values(values).returning({ id: campos.id });
    await insertChildren(campo.id, data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique")) {
      if (msg.includes("referencia_interna")) return { error: "La referencia interna ya existe" };
      if (msg.includes("slug")) return { error: "El slug ya está en uso; modificá el título o la referencia" };
    }
    return { error: `Error al guardar: ${msg}` };
  }

  revalidatePath("/admin/campos");
  redirect("/admin/campos");
}

// ─── Actualizar campo ─────────────────────────────────────────────────────────

export async function actualizarCampo(id: string, data: CampoFormData): Promise<{ error: string } | void> {
  const agenteId = await getAgenteId();

  const [existing] = await db
    .select({ id: campos.id, publishedAt: campos.publishedAt })
    .from(campos)
    .where(eq(campos.id, id));
  if (!existing) return { error: "Campo no encontrado" };

  const publishedAt = data.estadoPublicacion === "publicado"
    ? (existing.publishedAt ?? new Date())
    : null;

  const values = buildValues(data, agenteId, publishedAt);

  try {
    await db.update(campos).set({ ...values, updatedAt: new Date() }).where(eq(campos.id, id));
    await deleteChildren(id);
    await insertChildren(id, data);
  } catch (err) {
    return { error: `Error al guardar: ${err instanceof Error ? err.message : "Error desconocido"}` };
  }

  revalidatePath("/admin/campos");
  revalidatePath(`/admin/campos/${id}/editar`);
  redirect("/admin/campos");
}

// ─── Eliminar campo ───────────────────────────────────────────────────────────

export async function eliminarCampo(id: string): Promise<{ error: string } | void> {
  await getAgenteId();
  try {
    await db.delete(campos).where(eq(campos.id, id));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al eliminar" };
  }
  revalidatePath("/admin/campos");
}

// ─── Cambiar estado ───────────────────────────────────────────────────────────

export async function cambiarEstado(id: string, estado: string): Promise<void> {
  await db.update(campos).set({
    estadoPublicacion: estado as CampoInsert["estadoPublicacion"],
    publishedAt: estado === "publicado" ? new Date() : undefined,
    updatedAt: new Date(),
  }).where(eq(campos.id, id));
  revalidatePath("/admin/campos");
}

// ─── Helpers privados ─────────────────────────────────────────────────────────

async function deleteChildren(campoId: string) {
  await Promise.all([
    db.delete(padrones).where(eq(padrones.campoId, campoId)),
    db.delete(desgloseConeat).where(eq(desgloseConeat.campoId, campoId)),
    db.delete(fuentesAgua).where(eq(fuentesAgua.campoId, campoId)),
    db.delete(mejoras).where(eq(mejoras.campoId, campoId)),
  ]);
}

async function insertChildren(campoId: string, data: CampoFormData) {
  const promises: Promise<unknown>[] = [];

  const padronesValidos = data.padrones.filter((p) => p.numeroPadron.trim());
  if (padronesValidos.length) {
    promises.push(
      db.insert(padrones).values(
        padronesValidos.map((p) => ({
          campoId,
          numeroPadron: p.numeroPadron.trim(),
          departamento: n(p.departamento),
          superficieHa: num(p.superficieHa),
        }))
      )
    );
  }

  const coneatValidos = data.desgloseConeat.filter((c) => c.grupoSuelo && c.indice && c.hectareas);
  if (coneatValidos.length) {
    promises.push(
      db.insert(desgloseConeat).values(
        coneatValidos.map((c) => ({
          campoId,
          grupoSuelo: c.grupoSuelo.trim(),
          indice: c.indice.trim(),
          hectareas: c.hectareas.trim(),
        }))
      )
    );
  }

  const aguaValidas = data.fuentesAgua.filter((f) => f.tipo);
  if (aguaValidas.length) {
    promises.push(
      db.insert(fuentesAgua).values(
        aguaValidas.map((f): FuenteInsert => ({
          campoId,
          tipo: f.tipo as FuenteInsert["tipo"],
          cantidad: int(f.cantidad) ?? 1,
          estado: (n(f.estado) as FuenteInsert["estado"]) ?? null,
          observaciones: n(f.observaciones),
        }))
      )
    );
  }

  const mejorasValidas = data.mejoras.filter((m) => m.tipo);
  if (mejorasValidas.length) {
    promises.push(
      db.insert(mejoras).values(
        mejorasValidas.map((m): MejoraInsert => ({
          campoId,
          tipo: m.tipo as MejoraInsert["tipo"],
          superficieM2: num(m.superficieM2),
          estado: (n(m.estado) as MejoraInsert["estado"]) ?? null,
          descripcion: n(m.descripcion),
          antiguedadAnios: int(m.antiguedadAnios),
        }))
      )
    );
  }

  await Promise.all(promises);
}
