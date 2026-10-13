import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AgenteForm from "@/components/backoffice/AgenteForm";

export default async function NuevoAgentePage() {
  const session = await auth();
  if (session?.user?.rol !== "administrador") redirect("/admin");

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-semibold text-gray-900 mb-1">Nuevo agente</h1>
      <p className="text-gray-500 text-sm mb-8">Crear un usuario con acceso al backoffice</p>
      <AgenteForm />
    </div>
  );
}
