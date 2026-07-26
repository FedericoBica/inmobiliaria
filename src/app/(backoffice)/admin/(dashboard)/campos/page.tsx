import Link from "next/link";
import { db } from "@/db";
import { campos } from "@/db/schema/campos";
import { agentes } from "@/db/schema/agentes";
import { eq, desc } from "drizzle-orm";
import { EstadoSelect, DeleteButton } from "@/components/backoffice/CamposListActions";

function fmtN(n: string | number | null | undefined) {
  if (n === null || n === undefined || n === "") return "—";
  return new Intl.NumberFormat("es-UY").format(Math.round(Number(n)));
}

export default async function CamposAdminPage() {
  const rows = await db
    .select({
      id: campos.id,
      referencia: campos.referenciaInterna,
      titulo: campos.titulo,
      departamento: campos.departamento,
      superficieHa: campos.superficieHa,
      estadoPublicacion: campos.estadoPublicacion,
      precioUsdHa: campos.precioUsdHa,
      agente: agentes.nombre,
      slug: campos.slug,
      createdAt: campos.createdAt,
    })
    .from(campos)
    .leftJoin(agentes, eq(campos.agenteId, agentes.id))
    .orderBy(desc(campos.createdAt));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-gray-900">Campos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {rows.length} campo{rows.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Link
          href="/admin/campos/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2D4A1E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a5e27] transition-colors"
        >
          + Nuevo campo
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="font-display text-2xl text-gray-300 mb-3">◇</p>
          <p className="text-gray-500 mb-4">No hay campos cargados aún</p>
          <Link
            href="/admin/campos/nuevo"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2D4A1E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a5e27] transition-colors"
          >
            Crear primer campo
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Ref.", "Campo", "Depto.", "Ha", "USD/ha", "Estado", "Agente", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                    {row.referencia}
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <p className="font-medium text-gray-900 truncate">{row.titulo}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize whitespace-nowrap">
                    {row.departamento?.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">
                    {fmtN(row.superficieHa)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#A8881C] whitespace-nowrap">
                    {row.precioUsdHa ? `$${fmtN(row.precioUsdHa)}` : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EstadoSelect id={row.id} estado={row.estadoPublicacion} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {row.agente ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/campos/${row.id}/editar`}
                        className="text-xs text-[#2D4A1E] font-medium hover:underline"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/campos/${row.slug}`}
                        target="_blank"
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Ver →
                      </Link>
                      <DeleteButton id={row.id} referencia={row.referencia} />
                    </div>
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
