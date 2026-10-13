import { notFound } from "next/navigation";
import { db } from "@/db";
import { contenidos } from "@/db/schema/contenido";
import { eq } from "drizzle-orm";
import ContenidoForm from "@/components/backoffice/ContenidoForm";

export default async function EditarContenidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [c] = await db.select().from(contenidos).where(eq(contenidos.id, id));
  if (!c) notFound();

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-semibold text-gray-900 mb-1">Editar contenido</h1>
      <p className="text-gray-500 text-sm mb-8">{c.titulo}</p>
      <ContenidoForm
        contenidoId={c.id}
        initialData={{
          tipo: c.tipo,
          titulo: c.titulo,
          slug: c.slug,
          extracto: c.extracto ?? "",
          cuerpo: c.cuerpo,
          imagenDestacada: c.imagenDestacada ?? "",
          publicado: c.publicado,
        }}
      />
    </div>
  );
}
