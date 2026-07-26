import Link from "next/link";
import { db } from "@/db";
import { campos } from "@/db/schema/campos";
import { consultas } from "@/db/schema/consultas";
import { eq, count } from "drizzle-orm";

export default async function DashboardPage() {
  const [totalCampos, publicados, borradores, totalConsultas] = await Promise.all([
    db.select({ n: count() }).from(campos).then((r) => r[0].n),
    db.select({ n: count() }).from(campos).where(eq(campos.estadoPublicacion, "publicado")).then((r) => r[0].n),
    db.select({ n: count() }).from(campos).where(eq(campos.estadoPublicacion, "borrador")).then((r) => r[0].n),
    db.select({ n: count() }).from(consultas).then((r) => r[0].n),
  ]);

  const stats = [
    { label: "Campos totales", value: totalCampos, href: "/admin/campos" },
    { label: "Publicados", value: publicados, href: "/admin/campos?estado=publicado" },
    { label: "Borradores", value: borradores, href: "/admin/campos?estado=borrador" },
    { label: "Consultas", value: totalConsultas, href: "/admin/consultas" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#A8881C] hover:shadow-sm transition-all"
          >
            <p className="font-mono text-3xl font-semibold text-gray-900">{String(s.value)}</p>
            <p className="text-gray-500 text-sm mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/admin/campos/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2D4A1E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a5e27] transition-colors"
        >
          + Nuevo campo
        </Link>
        <Link
          href="/admin/campos"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Ver todos los campos
        </Link>
      </div>
    </div>
  );
}
