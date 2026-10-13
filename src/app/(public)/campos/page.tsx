import Link from "next/link";
import { Suspense } from "react";
import FiltrosCampos from "@/components/ui/FiltrosCampos";
import OrdenSelect from "@/components/ui/OrdenSelect";
import FiltrosDrawer from "@/components/ui/FiltrosDrawer";
import { getCamposListado, type CampoResumen } from "@/lib/campos-publico";
import { DEPARTAMENTO_LABEL } from "@/lib/departamentos";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Campo = CampoResumen;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtN(n: number) {
  return new Intl.NumberFormat("es-UY").format(Math.round(n));
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat("es-UY", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const APTITUD_LABEL: Record<string, string> = {
  agricola: "Agrícola", ganadera: "Ganadera",
  agricola_ganadera: "Agrícola-Ganadera", lechera: "Lechera",
  forestal: "Forestal", mixta: "Mixta",
};

const TIPO_LABEL: Record<string, string> = {
  venta: "Venta", arrendamiento: "Arrendamiento",
  pastoreo: "Pastoreo", permuta: "Permuta",
};

function coneatColor(idx: number) {
  if (idx >= 120) return "text-emerald-700 bg-emerald-50";
  if (idx >= 90)  return "text-campo bg-green-50";
  if (idx >= 70)  return "text-trigal bg-amber-50";
  return "text-piedra bg-crema";
}

type SearchParams = {
  departamento?: string; tipo?: string;
  ha_min?: string; ha_max?: string;
  precio_max?: string; coneat_min?: string;
  aptitud?: string;
};

// ─── Campo Card ───────────────────────────────────────────────────────────────

function CampoCard({ c }: { c: Campo }) {
  const precioPrincipal = c.tipoOperacion.includes("venta") && c.precioUsdHa
    ? { label: "USD/ha", value: fmtN(c.precioUsdHa) }
    : c.rentaUsdHaAnio
    ? { label: "USD/ha/año", value: fmtN(c.rentaUsdHaAnio) }
    : null;

  return (
    <Link
      href={`/campos/${c.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-crema hover:border-trigal hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Foto de portada (o placeholder si no tiene fotos) */}
      <div className="relative h-44 bg-gradient-to-br from-campo/20 via-campo/10 to-crema overflow-hidden">
        {c.fotoPortadaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.fotoPortadaUrl}
            alt={c.titulo}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <>
            <div className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 19px,rgba(168,136,28,0.15) 19px,rgba(168,136,28,0.15) 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,rgba(168,136,28,0.15) 19px,rgba(168,136,28,0.15) 20px)`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-5xl text-campo/20 select-none">
                {c.superficieHa >= 1000 ? "◈" : "◇"}
              </span>
            </div>
          </>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {c.tipoOperacion.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-md bg-campo text-white text-[11px] font-semibold uppercase tracking-wide">
              {TIPO_LABEL[t]}
            </span>
          ))}
          {c.esExclusiva && (
            <span className="px-2 py-0.5 rounded-md bg-trigal text-white text-[11px] font-semibold uppercase tracking-wide">
              Exclusiva
            </span>
          )}
        </div>
        {/* Referencia */}
        <span className="absolute top-3 right-3 font-mono text-[11px] text-white/70 bg-black/30 rounded px-1.5 py-0.5">
          {c.referencia}
        </span>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4">
        <p className="font-display text-[1.05rem] font-semibold text-tierra leading-snug line-clamp-2 mb-1.5 group-hover:text-campo transition-colors">
          {c.titulo}
        </p>
        <p className="text-piedra text-xs mb-3">
          {c.paraje} · {DEPARTAMENTO_LABEL[c.departamento] ?? c.departamento}
        </p>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div className="text-center">
            <p className="font-mono text-base font-semibold text-tierra leading-none">
              {fmtN(c.superficieHa)}
            </p>
            <p className="text-[10px] text-piedra uppercase tracking-wider mt-0.5">ha</p>
          </div>
          <div className="text-center border-x border-crema">
            <p className={`font-mono text-base font-semibold leading-none px-1 rounded ${c.coneatPromedio != null ? coneatColor(c.coneatPromedio) : "text-piedra"}`}>
              {c.coneatPromedio ?? "—"}
            </p>
            <p className="text-[10px] text-piedra uppercase tracking-wider mt-0.5">CONEAT</p>
          </div>
          <div className="text-center">
            {precioPrincipal ? (
              <>
                <p className="font-mono text-base font-semibold text-trigal leading-none">
                  {precioPrincipal.value}
                </p>
                <p className="text-[10px] text-piedra uppercase tracking-wider mt-0.5">{precioPrincipal.label}</p>
              </>
            ) : (
              <>
                <p className="font-mono text-base font-semibold text-piedra leading-none">—</p>
                <p className="text-[10px] text-piedra uppercase tracking-wider mt-0.5">precio</p>
              </>
            )}
          </div>
        </div>

        {/* Aptitud */}
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-crema">
          {c.aptitud.map((a) => (
            <span key={a} className="text-[10px] text-campo bg-campo/8 rounded px-1.5 py-0.5 font-medium">
              {APTITUD_LABEL[a] ?? a}
            </span>
          ))}
          {c.precioVentaUsd && (
            <span className="ml-auto text-[10px] text-piedra font-mono">
              {fmtUsd(c.precioVentaUsd)} total
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

type Props = { searchParams: Promise<SearchParams & { orden?: string }> };

export default async function CamposPage({ searchParams }: Props) {
  const sp = await searchParams;
  const orden = sp.orden ?? "reciente";
  const resultados = await getCamposListado(sp);

  const hayFiltros = !!(sp.departamento || sp.tipo || sp.ha_min || sp.ha_max || sp.precio_max || sp.coneat_min || sp.aptitud);

  return (
    <div className="bg-[#FBF8F3] min-h-screen">

      {/* Page header */}
      <div className="bg-white border-b border-crema">
        <div className="max-w-screen-xl mx-auto px-6 py-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-piedra mb-3">
            <Link href="/" className="hover:text-tierra transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-tierra">Campos</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div>
              <h1 className="font-display text-[2rem] font-semibold text-tierra leading-tight">
                {hayFiltros ? "Resultados de búsqueda" : "Campos en venta y arrendamiento"}
              </h1>
              <p className="text-piedra text-sm mt-1">
                {resultados.length === 0
                  ? "No se encontraron campos con esos filtros"
                  : `${resultados.length} campo${resultados.length !== 1 ? "s" : ""} encontrado${resultados.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            {/* Orden — solo visible en desktop; en mobile aparece en la toolbar de resultados */}
            {resultados.length > 1 && (
              <div className="sm:ml-auto hidden lg:block">
                <Suspense>
                  <OrdenSelect orden={orden} />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="flex gap-8 items-start">

          {/* Sidebar filtros */}
          <div className="hidden lg:block w-64 shrink-0 sticky top-24">
            <div className="bg-white rounded-2xl border border-crema p-5">
              <Suspense>
                <FiltrosCampos />
              </Suspense>
            </div>
          </div>

          {/* Resultados */}
          <div className="flex-1 min-w-0">
            {/* Mobile toolbar: filtros + orden */}
            <div className="flex items-center gap-3 mb-5 lg:hidden">
              <Suspense>
                <FiltrosDrawer />
              </Suspense>
              {resultados.length > 1 && (
                <Suspense>
                  <OrdenSelect orden={orden} />
                </Suspense>
              )}
            </div>

            {resultados.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-crema">
                <p className="font-display text-3xl text-tierra/20 mb-3">◇</p>
                <p className="font-display text-xl font-semibold text-tierra mb-2">
                  Sin resultados
                </p>
                <p className="text-piedra text-sm mb-6">
                  No encontramos campos que coincidan con los filtros seleccionados.
                </p>
                <Link
                  href="/campos"
                  className="inline-flex items-center gap-2 rounded-xl bg-trigal px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8A6E14] transition-colors"
                >
                  Ver todos los campos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {resultados.map((c) => (
                  <CampoCard key={c.id} c={c} />
                ))}
              </div>
            )}

            {/* CTA si hay pocos resultados */}
            {resultados.length > 0 && resultados.length < 4 && (
              <div className="mt-8 rounded-2xl bg-campo px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-display text-lg font-semibold text-white mb-1">
                    ¿No encontrás lo que buscás?
                  </p>
                  <p className="text-white/70 text-sm">
                    Registrate para recibir alertas cuando ingrese un campo que coincida con tu búsqueda.
                  </p>
                </div>
                <Link
                  href="/alertas"
                  className="shrink-0 rounded-xl bg-trigal px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8A6E14] transition-colors whitespace-nowrap"
                >
                  Crear alerta
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-crema bg-white">
        <div className="max-w-screen-xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center gap-4 text-sm text-piedra">
          <p className="font-display text-base font-semibold text-campo">Inmobiliaria Rural Uruguay</p>
          <p className="md:ml-auto">© {new Date().getFullYear()} · Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
}
