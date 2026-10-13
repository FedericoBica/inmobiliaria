import Link from "next/link";
import { notFound } from "next/navigation";
import { getContenidoPorSlug, TIPO_CONTENIDO_LABEL } from "@/lib/contenido-publico";

function fmtFecha(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export default async function InformeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contenido = await getContenidoPorSlug(slug);
  if (!contenido) notFound();

  const parrafos = contenido.cuerpo.split(/\n{2,}/).filter((p) => p.trim());

  return (
    <div className="bg-[#FBF8F3] min-h-screen">
      <div className="bg-white border-b border-crema">
        <div className="max-w-screen-xl mx-auto px-6 py-5">
          <nav className="flex items-center gap-1.5 text-xs text-piedra mb-3 flex-wrap">
            <Link href="/" className="hover:text-tierra transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/informes" className="hover:text-tierra transition-colors">Informes</Link>
            <span>/</span>
            <span className="text-tierra">{contenido.titulo}</span>
          </nav>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-trigal mb-3">
          {TIPO_CONTENIDO_LABEL[contenido.tipo] ?? contenido.tipo}
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-tierra leading-tight mb-4">
          {contenido.titulo}
        </h1>
        <div className="flex items-center gap-3 text-piedra text-sm mb-8 pb-8 border-b border-crema">
          {contenido.autorNombre && <span>{contenido.autorNombre}</span>}
          {contenido.autorNombre && contenido.publishedAt && <span>·</span>}
          {contenido.publishedAt && <span className="capitalize">{fmtFecha(contenido.publishedAt)}</span>}
        </div>

        {contenido.imagenDestacada && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={contenido.imagenDestacada}
            alt=""
            className="w-full rounded-2xl mb-10 object-cover max-h-96"
          />
        )}

        <div className="prose prose-tierra max-w-none">
          {parrafos.map((p, i) => (
            <p key={i} className="text-tierra text-base leading-relaxed mb-5 whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-crema">
          <Link href="/informes" className="text-trigal text-sm font-semibold hover:underline">
            ← Volver a informes
          </Link>
        </div>
      </article>

      <footer className="mt-8 border-t border-crema bg-white">
        <div className="max-w-screen-xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center gap-4 text-sm text-piedra">
          <p className="font-display text-base font-semibold text-campo">Inmobiliaria Rural Uruguay</p>
          <p className="md:ml-auto">© {new Date().getFullYear()} · Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
}
