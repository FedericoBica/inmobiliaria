import Link from "next/link";
import { db } from "@/db";
import { contenidos } from "@/db/schema/contenido";
import { desc } from "drizzle-orm";
import { DeleteContenidoButton } from "@/components/backoffice/ContenidoListActions";

const TIPO_LABEL: Record<string, string> = {
  informe_mercado: "Informe de mercado",
  articulo: "Artículo",
  guia: "Guía",
};

export default async function ContenidoAdminPage() {
  const rows = await db.select().from(contenidos).orderBy(desc(contenidos.createdAt));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-gray-900">Contenido</h1>
          <p className="text-gray-500 text-sm mt-1">
            {rows.length} publicación{rows.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Link
          href="/admin/contenido/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2D4A1E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a5e27] transition-colors"
        >
          + Nuevo
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">No hay contenido cargado aún</p>
          <Link href="/admin/contenido/nuevo" className="inline-flex items-center gap-2 rounded-xl bg-[#2D4A1E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a5e27] transition-colors">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Título", "Tipo", "Estado", "Actualizado", ""].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 max-w-[320px]">
                    <p className="font-medium text-gray-900 truncate">{c.titulo}</p>
                    <p className="text-xs text-gray-400 truncate">{c.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{TIPO_LABEL[c.tipo] ?? c.tipo}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.publicado ? (
                      <span className="text-xs font-semibold text-campo bg-green-50 rounded-full px-2 py-1">Publicado</span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-1">Borrador</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Intl.DateTimeFormat("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" }).format(c.updatedAt)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/contenido/${c.id}/editar`} className="text-xs text-[#2D4A1E] font-medium hover:underline">
                        Editar
                      </Link>
                      <DeleteContenidoButton id={c.id} />
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
