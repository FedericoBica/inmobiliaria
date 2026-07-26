import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { campos } from "@/db/schema/campos";
import { padrones, desgloseConeat, fuentesAgua, mejoras } from "@/db/schema/campo-children";
import { eq } from "drizzle-orm";
import CampoForm from "@/components/backoffice/CampoForm";
import type { CampoFormData } from "@/app/(backoffice)/admin/(dashboard)/campos/actions";

type Props = { params: Promise<{ id: string }> };

export default async function EditarCampoPage({ params }: Props) {
  const { id } = await params;

  const [campo] = await db.select().from(campos).where(eq(campos.id, id));
  if (!campo) notFound();

  const [padronesRows, coneatRows, aguaRows, mejorasRows] = await Promise.all([
    db.select().from(padrones).where(eq(padrones.campoId, id)),
    db.select().from(desgloseConeat).where(eq(desgloseConeat.campoId, id)),
    db.select().from(fuentesAgua).where(eq(fuentesAgua.campoId, id)),
    db.select().from(mejoras).where(eq(mejoras.campoId, id)),
  ]);

  const initialData: Partial<CampoFormData> = {
    referenciaInterna: campo.referenciaInterna ?? "",
    titulo: campo.titulo ?? "",
    slug: campo.slug ?? "",
    departamento: campo.departamento ?? "",
    paraje: campo.paraje ?? "",
    seccionJudicial: campo.seccionJudicial ?? "",
    seccionPolicial: campo.seccionPolicial ?? "",
    tipoOperacion: (campo.tipoOperacion as string[]) ?? [],
    precioVentaUsd: campo.precioVentaUsd ?? "",
    precioAConsultar: campo.precioAConsultar ?? false,
    rentaArrendamientoUsdHaAnio: campo.rentaArrendamientoUsdHaAnio ?? "",
    precioPastoreo: campo.precioPastoreo ?? "",
    unidadPastoreo: campo.unidadPastoreo ?? "",
    estadoOcupacion: campo.estadoOcupacion ?? "",
    fechaVencimientoContrato: campo.fechaVencimientoContrato
      ? new Date(campo.fechaVencimientoContrato).toISOString().split("T")[0]
      : "",
    esExclusiva: campo.esExclusiva ?? false,
    superficieHa: campo.superficieHa ?? "",
    aptitud: (campo.aptitud as string[]) ?? [],
    dotacionHistoricaUgHa: campo.dotacionHistoricaUgHa ?? "",
    pctPrioridadForestal: campo.pctPrioridadForestal ?? "",
    haLaborable: campo.haLaborable ?? "",
    haCampoNatural: campo.haCampoNatural ?? "",
    haPraderas: campo.haPraderas ?? "",
    haMonteNativo: campo.haMonteNativo ?? "",
    haForestado: campo.haForestado ?? "",
    energia: campo.energia ?? "",
    acceso: campo.acceso ?? "",
    accesoTodoTiempo: campo.accesoTodoTiempo ?? null,
    kmARuta: campo.kmARuta ?? "",
    kmACentroPoblado: campo.kmACentroPoblado ?? "",
    centroPobladoReferencia: campo.centroPobladoReferencia ?? "",
    cantidadPotreros: campo.cantidadPotreros != null ? String(campo.cantidadPotreros) : "",
    kmAlambrado: campo.kmAlambrado ?? "",
    alambradoPerimetralEstado: campo.alambradoPerimetralEstado ?? "",
    alambradoDivisorioEstado: campo.alambradoDivisorioEstado ?? "",
    tieneDerechoRiego: campo.tieneDerechoRiego ?? false,
    padronConPermisoRiego: campo.padronConPermisoRiego ?? "",
    haBajoRiego: campo.haBajoRiego ?? "",
    precisionUbicacion: campo.precisionUbicacion ?? "oculta",
    radioAproximacionM: campo.radioAproximacionM != null ? String(campo.radioAproximacionM) : "",
    estadoPublicacion: campo.estadoPublicacion ?? "borrador",
    destacado: campo.destacado ?? false,
    notasInternas: campo.notasInternas ?? "",
    estadoDominial: campo.estadoDominial ?? "",
    observacionesJuridicas: campo.observacionesJuridicas ?? "",

    desgloseConeat: coneatRows.map((r) => ({
      id: r.id, grupoSuelo: r.grupoSuelo, indice: r.indice ?? "", hectareas: r.hectareas ?? "",
    })),
    fuentesAgua: aguaRows.map((r) => ({
      id: r.id, tipo: r.tipo ?? "", cantidad: String(r.cantidad ?? 1),
      estado: r.estado ?? "", observaciones: r.observaciones ?? "",
    })),
    mejoras: mejorasRows.map((r) => ({
      id: r.id, tipo: r.tipo ?? "", superficieM2: r.superficieM2 ?? "",
      estado: r.estado ?? "", descripcion: r.descripcion ?? "",
      antiguedadAnios: r.antiguedadAnios != null ? String(r.antiguedadAnios) : "",
    })),
    padrones: padronesRows.map((r) => ({
      id: r.id, numeroPadron: r.numeroPadron ?? "", departamento: r.departamento ?? "",
      superficieHa: r.superficieHa ?? "",
    })),
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Link href="/admin" className="hover:text-gray-600">Admin</Link>
          <span>/</span>
          <Link href="/admin/campos" className="hover:text-gray-600">Campos</Link>
          <span>/</span>
          <span className="text-gray-700">{campo.referenciaInterna}</span>
        </nav>
        <h1 className="font-display text-3xl font-semibold text-gray-900">
          Editar campo
        </h1>
        <p className="text-gray-500 text-sm mt-1">{campo.titulo}</p>
      </div>

      <CampoForm campoId={id} initialData={initialData} />
    </div>
  );
}
