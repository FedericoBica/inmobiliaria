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
  historialPrecios,
} from "@/db/schema/campo-children";
import { eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { slugify } from "@/lib/slugify";
import { encrypt, decrypt } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";

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
  propietarioNombre: string;
  propietarioTelefono: string;
  propietarioEmail: string;
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

// Serializa y cifra los datos de contacto del propietario — nunca se
// guardan en texto plano (dato sensible, spec 11.2).
function buildPropietarioContacto(data: CampoFormData): string | null {
  const nombre = data.propietarioNombre.trim();
  const telefono = data.propietarioTelefono.trim();
  const email = data.propietarioEmail.trim();
  if (!nombre && !telefono && !email) return null;
  return encrypt(JSON.stringify({ nombre, telefono, email }));
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
    propietarioContacto: buildPropietarioContacto(data),
    agenteId,
    publishedAt: publishedAt,
  };
}

// ─── Auditoría: snapshot curado de campos sensibles/comerciales ──────────────
// Se excluyen deliberadamente propietarioContacto y notasInternas del log
// para no duplicar datos sensibles/internos en la tabla de auditoría.

const AUDIT_FIELDS = [
  "referenciaInterna",
  "titulo",
  "estadoPublicacion",
  "precioVentaUsd",
  "precioUsdHa",
  "rentaArrendamientoUsdHaAnio",
  "departamento",
  "superficieHa",
] as const;

// Campos numéric(precision,scale) de Postgres vuelven como string con
// ceros de relleno (ej. "100.00") — comparar como float evita diffs falsos
// contra el valor recién ingresado en el form (ej. "100").
const NUMERIC_AUDIT_FIELDS = new Set([
  "precioVentaUsd",
  "precioUsdHa",
  "rentaArrendamientoUsdHaAnio",
  "superficieHa",
]);

function curatedSnapshot(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of AUDIT_FIELDS) out[f] = row[f] ?? null;
  return out;
}

function valuesEqual(key: string, a: unknown, b: unknown): boolean {
  if (NUMERIC_AUDIT_FIELDS.has(key)) {
    const fa = a == null || a === "" ? null : parseFloat(String(a));
    const fb = b == null || b === "" ? null : parseFloat(String(b));
    return fa === fb || (Number.isNaN(fa as number) && Number.isNaN(fb as number));
  }
  return String(a ?? "") === String(b ?? "");
}

function diffSnapshots(before: Record<string, unknown>, after: Record<string, unknown>) {
  const beforeDiff: Record<string, unknown> = {};
  const afterDiff: Record<string, unknown> = {};
  for (const key of AUDIT_FIELDS) {
    if (!valuesEqual(key, before[key], after[key])) {
      beforeDiff[key] = before[key] ?? null;
      afterDiff[key] = after[key] ?? null;
    }
  }
  return { beforeDiff, afterDiff };
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

  let campoId: string;
  try {
    const [campo] = await db.insert(campos).values(values).returning({ id: campos.id });
    campoId = campo.id;
    await insertChildren(campo.id, data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique")) {
      if (msg.includes("referencia_interna")) return { error: "La referencia interna ya existe" };
      if (msg.includes("slug")) return { error: "El slug ya está en uso; modificá el título o la referencia" };
    }
    return { error: `Error al guardar: ${msg}` };
  }

  await logAudit({
    tabla: "campos",
    registroId: campoId,
    accion: "INSERT",
    valorNuevo: curatedSnapshot(values as unknown as Record<string, unknown>),
  });

  revalidatePath("/admin/campos");
  redirect("/admin/campos");
}

// ─── Actualizar campo ─────────────────────────────────────────────────────────

export async function actualizarCampo(id: string, data: CampoFormData): Promise<{ error: string } | void> {
  const agenteId = await getAgenteId();

  const [existing] = await db.select().from(campos).where(eq(campos.id, id));
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

  const before = curatedSnapshot(existing as unknown as Record<string, unknown>);
  const after = curatedSnapshot(values as unknown as Record<string, unknown>);
  const { beforeDiff, afterDiff } = diffSnapshots(before, after);

  if (Object.keys(afterDiff).length > 0) {
    await logAudit({
      tabla: "campos",
      registroId: id,
      accion: "UPDATE",
      valorAnterior: beforeDiff,
      valorNuevo: afterDiff,
    });
  }

  const precioCambio =
    !valuesEqual("precioVentaUsd", existing.precioVentaUsd, values.precioVentaUsd) ||
    !valuesEqual("precioUsdHa", existing.precioUsdHa, values.precioUsdHa) ||
    !valuesEqual(
      "rentaArrendamientoUsdHaAnio",
      existing.rentaArrendamientoUsdHaAnio,
      values.rentaArrendamientoUsdHaAnio
    );

  if (precioCambio) {
    await db.insert(historialPrecios).values({
      campoId: id,
      precioVentaUsd: values.precioVentaUsd ?? null,
      precioUsdHa: values.precioUsdHa ?? null,
      rentaArrendamientoUsdHaAnio: values.rentaArrendamientoUsdHaAnio ?? null,
      modificadoPor: agenteId,
    });
  }

  revalidatePath("/admin/campos");
  revalidatePath(`/admin/campos/${id}/editar`);
  redirect("/admin/campos");
}

// ─── Eliminar campo ───────────────────────────────────────────────────────────

export async function eliminarCampo(id: string): Promise<{ error: string } | void> {
  await getAgenteId();

  const [existing] = await db.select().from(campos).where(eq(campos.id, id));
  if (!existing) return { error: "Campo no encontrado" };

  try {
    await db.delete(campos).where(eq(campos.id, id));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error al eliminar" };
  }

  await logAudit({
    tabla: "campos",
    registroId: id,
    accion: "DELETE",
    valorAnterior: curatedSnapshot(existing as unknown as Record<string, unknown>),
  });

  revalidatePath("/admin/campos");
}

// ─── Cambiar estado ───────────────────────────────────────────────────────────

export async function cambiarEstado(id: string, estado: string): Promise<void> {
  const [existing] = await db
    .select({ estadoPublicacion: campos.estadoPublicacion })
    .from(campos)
    .where(eq(campos.id, id));

  await db.update(campos).set({
    estadoPublicacion: estado as CampoInsert["estadoPublicacion"],
    publishedAt: estado === "publicado" ? new Date() : undefined,
    updatedAt: new Date(),
  }).where(eq(campos.id, id));

  await logAudit({
    tabla: "campos",
    registroId: id,
    accion: "UPDATE",
    valorAnterior: { estadoPublicacion: existing?.estadoPublicacion ?? null },
    valorNuevo: { estadoPublicacion: estado },
  });

  revalidatePath("/admin/campos");
}

// ─── Obtener datos del propietario (descifrados) para el formulario ─────────
// Cada acceso queda registrado en el log de auditoría (spec 11.2).

export type PropietarioContacto = { nombre: string; telefono: string; email: string };

export async function obtenerPropietarioContacto(
  campoId: string
): Promise<PropietarioContacto> {
  const vacio: PropietarioContacto = { nombre: "", telefono: "", email: "" };

  const [campo] = await db
    .select({ propietarioContacto: campos.propietarioContacto })
    .from(campos)
    .where(eq(campos.id, campoId));
  if (!campo?.propietarioContacto) return vacio;

  let data: PropietarioContacto;
  try {
    data = JSON.parse(decrypt(campo.propietarioContacto)) as PropietarioContacto;
  } catch (err) {
    console.error("[obtenerPropietarioContacto] Error al descifrar", err);
    return vacio;
  }

  await logAudit({
    tabla: "campos.propietario_contacto",
    registroId: campoId,
    accion: "READ",
  });

  return data;
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
