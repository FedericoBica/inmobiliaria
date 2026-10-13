import ContenidoForm from "@/components/backoffice/ContenidoForm";

export default function NuevoContenidoPage() {
  return (
    <div className="p-8">
      <h1 className="font-display text-3xl font-semibold text-gray-900 mb-1">Nuevo contenido</h1>
      <p className="text-gray-500 text-sm mb-8">Informe de mercado, artículo o guía</p>
      <ContenidoForm />
    </div>
  );
}
