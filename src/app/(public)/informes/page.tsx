import Link from "next/link";
import { getContenidosPublicados, TIPO_CONTENIDO_LABEL } from "@/lib/contenido-publico";

export const metadata = {
  title: "Informes de mercado — Inmobiliaria Rural Uruguay",
  description: "Informes de precios, artículos técnicos y guías sobre el mercado de campos en Uruguay.",
};

function fmtFecha(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("es-UY", { month: "long", year: "numeric" }).format(d);
}

export default async function InformesPage() {
  const contenidos = await getContenidosPublicados();

  return (
    <div className="bg-[#FBF8F3] min-h-screen">
      <div className="bg-white border-b border-crema">
        <div className="max-w-screen-xl mx-auto px-6 py-5">
          <nav className="flex items-center gap-1.5 text-xs text-piedra mb-3">
            <Link href="/" className="hover:text-tierra transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-tierra">Informes</span>
          </nav>
          <h1 className="font-display text-[2rem] font-semibold text-tierra leading-tight">
            Informes de mercado
          </h1>
          <p className="text-piedra text-sm mt-1">
            Precios, análisis técnico y guías sobre el mercado de campos en Uruguay
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-12">
        {contenidos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-crema">
            <p className="font-display text-xl font-semibold text-tierra mb-2">
              Todavía no hay informes publicados
            </p>
            <p className="text-piedra text-sm">Volvé a consultar pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contenidos.map((c) => (
              <Link
                key={c.id}
                href={`/informes/${c.slug}`}
                className="group flex flex-col bg-white rounded-xl border border-crema overflow-hidden hover:border-trigal/50 hover:shadow-sm transition-all"
              >
                {c.imagenDestacada ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imagenDestacada} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 w-full bg-campo/10 flex items-center justify-center">
                    <span className="font-display text-4xl text-campo/20">◇</span>
                  </div>
                )}
                <div className="flex flex-col flex-1 p-6">
                  <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-trigal mb-3">
                    {TIPO_CONTENIDO_LABEL[c.tipo] ?? c.tipo}
                  </span>
                  <h2 className="font-display text-xl font-semibold text-tierra mb-3 leading-snug group-hover:text-trigal transition-colors">
                    {c.titulo}
                  </h2>
                  {c.extracto && (
                    <p className="text-piedra text-sm leading-relaxed flex-1">{c.extracto}</p>
                  )}
                  <div className="mt-5 pt-4 border-t border-crema flex items-center justify-between">
                    <span className="text-piedra text-xs font-mono capitalize">{fmtFecha(c.publishedAt)}</span>
                    <span className="text-trigal text-sm font-semibold group-hover:underline">Leer →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-8 border-t border-crema bg-white">
        <div className="max-w-screen-xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center gap-4 text-sm text-piedra">
          <p className="font-display text-base font-semibold text-campo">Inmobiliaria Rural Uruguay</p>
          <p className="md:ml-auto">© {new Date().getFullYear()} · Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
}
