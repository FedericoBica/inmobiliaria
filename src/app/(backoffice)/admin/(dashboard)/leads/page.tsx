import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { consultas, estadoConsultaEnum } from "@/db/schema/consultas";
import { campos } from "@/db/schema/campos";
import { eq, desc, and } from "drizzle-orm";
import { EstadoConsultaSelect, NotasConsulta } from "@/components/backoffice/LeadsListActions";

const CANAL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  formulario: "Formulario",
  telefono: "Teléfono",
  alerta: "Alerta",
  captacion_oferta: "Captación de oferta",
};

const ESTADOS = estadoConsultaEnum.enumValues;

const ESTADO_LABEL: Record<string, string> = {
  nueva: "Nueva",
  contactado: "Contactado",
  en_negociacion: "En negociación",
  cerrado_ganado: "Cerrado (ganado)",
  cerrado_perdido: "Cerrado (perdido)",
  descartado: "Descartado",
};

function fmtFecha(d: Date) {
  return new Intl.DateTimeFormat("es-UY", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
}

export default async function LeadsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const session = await auth();
  const rol = session?.user?.rol;

  // "editor_contenido" no tiene acceso a leads (CLAUDE.md, tabla de roles) —
  // proxy.ts ya lo bloquea, se repite acá por defensa en profundidad.
  if (!session?.user?.id || rol === "editor_contenido") redirect("/admin");

  const soloLectura = rol === "solo_lectura";
  const { estado } = await searchParams;

  const condiciones = [];
  if (estado && (ESTADOS as readonly string[]).includes(estado)) {
    condiciones.push(eq(consultas.estado, estado as (typeof ESTADOS)[number]));
  }
  // "Agente": solo sus campos y sus leads — leads sin campo asociado
  // (ej. captación general) no son de ningún agente en particular.
  if (rol === "agente") {
    condiciones.push(eq(campos.agenteId, session.user.id));
  }

  const rows = await db
    .select({
      id: consultas.id,
      nombre: consultas.nombre,
      email: consultas.email,
      telefono: consultas.telefono,
      mensaje: consultas.mensaje,
      canal: consultas.canal,
      estado: consultas.estado,
      notasInternas: consultas.notasInternas,
      createdAt: consultas.createdAt,
      campoId: campos.id,
      campoReferencia: campos.referenciaInterna,
    })
    .from(consultas)
    .leftJoin(campos, eq(consultas.campoId, campos.id))
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(desc(consultas.createdAt));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-gray-900">Leads</h1>
        <p className="text-gray-500 text-sm mt-1">
          {rows.length} consulta{rows.length !== 1 ? "s" : ""}
          {estado ? ` — ${ESTADO_LABEL[estado] ?? estado}` : " en total"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin/leads"
          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${!estado ? "bg-[#2D4A1E] text-white border-[#2D4A1E]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
        >
          Todas
        </Link>
        {ESTADOS.map((e) => (
          <Link
            key={e}
            href={`/admin/leads?estado=${e}`}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${estado === e ? "bg-[#2D4A1E] text-white border-[#2D4A1E]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            {ESTADO_LABEL[e]}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No hay consultas{estado ? " con ese estado" : " todavía"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Fecha", "Contacto", "Campo", "Canal", "Mensaje", "Estado", "Notas"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors align-top">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtFecha(r.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{r.nombre}</p>
                    {r.email && <p className="text-xs text-gray-500">{r.email}</p>}
                    {r.telefono && <p className="text-xs text-gray-500">{r.telefono}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.campoId ? (
                      <Link href={`/admin/campos/${r.campoId}/editar`} className="text-xs text-[#2D4A1E] font-medium hover:underline">
                        {r.campoReferencia}
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{CANAL_LABEL[r.canal] ?? r.canal}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[220px]">
                    <p className="line-clamp-2">{r.mensaje ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EstadoConsultaSelect id={r.id} estado={r.estado} readOnly={soloLectura} />
                  </td>
                  <td className="px-4 py-3 min-w-[180px]">
                    <NotasConsulta id={r.id} notas={r.notasInternas ?? ""} readOnly={soloLectura} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
