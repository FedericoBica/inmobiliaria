import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { agentes } from "@/db/schema/agentes";
import { eq } from "drizzle-orm";
import AgenteForm from "@/components/backoffice/AgenteForm";

export default async function EditarAgentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.rol !== "administrador") redirect("/admin");

  const { id } = await params;
  const [agente] = await db.select().from(agentes).where(eq(agentes.id, id));
  if (!agente) notFound();

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-semibold text-gray-900 mb-1">
        Editar agente
      </h1>
      <p className="text-gray-500 text-sm mb-8">{agente.email}</p>
      <AgenteForm
        agenteId={agente.id}
        initialData={{
          nombre: agente.nombre,
          apellido: agente.apellido,
          email: agente.email,
          telefono: agente.telefono ?? "",
          rol: agente.rol,
        }}
        bloquearRolPropio={agente.id === session.user.id}
      />
    </div>
  );
}
