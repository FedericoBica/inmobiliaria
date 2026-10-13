import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { agentes } from "@/db/schema/agentes";
import { desc } from "drizzle-orm";
import {
  ToggleActivoButton,
  DesbloquearButton,
  ResetPasswordButton,
} from "@/components/backoffice/AgentesListActions";

const ROL_LABEL: Record<string, string> = {
  administrador: "Administrador",
  gerente_comercial: "Gerente comercial",
  agente: "Agente",
  editor_contenido: "Editor de contenido",
  solo_lectura: "Solo lectura",
};

export default async function AgentesAdminPage() {
  const session = await auth();
  // proxy.ts ya restringe la ruta a administradores; se repite acá porque
  // esta página además decide qué botones mostrar según sea la cuenta propia.
  if (session?.user?.rol !== "administrador") redirect("/admin");

  const rows = await db.select().from(agentes).orderBy(desc(agentes.createdAt));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-gray-900">Agentes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {rows.length} usuario{rows.length !== 1 ? "s" : ""} del backoffice
          </p>
        </div>
        <Link
          href="/admin/agentes/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2D4A1E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a5e27] transition-colors"
        >
          + Nuevo agente
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Nombre", "Email", "Rol", "Estado", "", "", ""].map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((a) => {
              const bloqueado = Boolean(a.lockedUntil && a.lockedUntil > new Date());
              const esPropio = a.id === session.user.id;
              return (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {a.nombre} {a.apellido}
                      {esPropio && <span className="text-gray-400 text-xs ml-1.5">(vos)</span>}
                    </p>
                    {a.telefono && <p className="text-xs text-gray-400">{a.telefono}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/admin/agentes/${a.id}/editar`} className="text-[#2D4A1E] hover:underline text-xs font-medium">
                      {ROL_LABEL[a.rol] ?? a.rol}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {bloqueado ? (
                      <span className="text-xs font-medium text-red-600">Bloqueada</span>
                    ) : a.activo ? (
                      <span className="text-xs font-medium text-campo">Activo</span>
                    ) : (
                      <span className="text-xs font-medium text-gray-400">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ToggleActivoButton id={a.id} activo={a.activo} esPropio={esPropio} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <DesbloquearButton id={a.id} bloqueado={bloqueado} />
                  </td>
                  <td className="px-4 py-3">
                    <ResetPasswordButton id={a.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
