import Link from "next/link";
import { Suspense } from "react";
import FiltrosCampos from "@/components/ui/FiltrosCampos";
import OrdenSelect from "@/components/ui/OrdenSelect";
import FiltrosDrawer from "@/components/ui/FiltrosDrawer";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Campo = {
  id: string;
  referencia: string;
  slug: string;
  titulo: string;
  departamento: string;
  paraje: string;
  superficieHa: number;
  coneatPromedio: number;
  precioUsdHa: number;
  precioVentaUsd: number | null;
  rentaUsdHaAnio: number | null;
  tipoOperacion: string[];
  aptitud: string[];
  esExclusiva: boolean;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const TODOS_LOS_CAMPOS: Campo[] = [
  {
    id: "1", referencia: "CA-0042", slug: "campo-ganadero-tacuarembo-ca-0042",
    titulo: "Campo ganadero sobre Ruta 5",
    departamento: "tacuarembo", paraje: "Paso de los Toros",
    superficieHa: 450, coneatPromedio: 95,
    precioUsdHa: 3200, precioVentaUsd: 1440000, rentaUsdHaAnio: null,
    tipoOperacion: ["venta"], aptitud: ["ganadera"], esExclusiva: true,
  },
  {
    id: "2", referencia: "CA-0087", slug: "campo-agricola-ganadero-paysandu-ca-0087",
    titulo: "Chacra agrícola-ganadera sobre el Río Queguay",
    departamento: "paysandu", paraje: "Chapicuy",
    superficieHa: 820, coneatPromedio: 112,
    precioUsdHa: 2800, precioVentaUsd: 2296000, rentaUsdHaAnio: null,
    tipoOperacion: ["venta"], aptitud: ["agricola_ganadera"], esExclusiva: true,
  },
  {
    id: "3", referencia: "CA-0031", slug: "campo-agricola-soriano-ca-0031",
    titulo: "Campo agrícola de alta productividad — Cuenca del Santa Lucía",
    departamento: "soriano", paraje: "Cardona",
    superficieHa: 1240, coneatPromedio: 108,
    precioUsdHa: 4100, precioVentaUsd: 5084000, rentaUsdHaAnio: null,
    tipoOperacion: ["venta"], aptitud: ["agricola"], esExclusiva: false,
  },
  {
    id: "4", referencia: "CA-0118", slug: "campo-lechero-colonia-ca-0118",
    titulo: "Tambo completo con sala de ordeñe y 4 potreros",
    departamento: "colonia", paraje: "Tarariras",
    superficieHa: 320, coneatPromedio: 130,
    precioUsdHa: 5600, precioVentaUsd: 1792000, rentaUsdHaAnio: null,
    tipoOperacion: ["venta"], aptitud: ["lechera"], esExclusiva: true,
  },
  {
    id: "5", referencia: "CA-0067", slug: "campo-arrendamiento-durazno-ca-0067",
    titulo: "Campo en arrendamiento — zona cerealera",
    departamento: "durazno", paraje: "Santa Bernardina",
    superficieHa: 680, coneatPromedio: 88,
    precioUsdHa: 0, precioVentaUsd: null, rentaUsdHaAnio: 180,
    tipoOperacion: ["arrendamiento"], aptitud: ["ganadera"], esExclusiva: false,
  },
  {
    id: "6", referencia: "CA-0099", slug: "campo-forestal-rivera-ca-0099",
    titulo: "Zona de prioridad forestal — apto eucaliptus",
    departamento: "rivera", paraje: "Vichadero",
    superficieHa: 2100, coneatPromedio: 62,
    precioUsdHa: 1400, precioVentaUsd: 2940000, rentaUsdHaAnio: null,
    tipoOperacion: ["venta"], aptitud: ["forestal"], esExclusiva: false,
  },
  {
    id: "7", referencia: "CA-0055", slug: "campo-ganadero-cerro-largo-ca-0055",
    titulo: "Cuchilla de Haedo — campo ganadero extensivo",
    departamento: "cerro_largo", paraje: "Melo",
    superficieHa: 1890, coneatPromedio: 78,
    precioUsdHa: 1950, precioVentaUsd: 3685500, rentaUsdHaAnio: null,
    tipoOperacion: ["venta"], aptitud: ["ganadera"], esExclusiva: false,
  },
  {
    id: "8", referencia: "CA-0143", slug: "campo-agricola-florida-ca-0143",
    titulo: "Campo agrícola con lago artificial y sistema de riego",
    departamento: "florida", paraje: "Sarandí Grande",
    superficieHa: 560, coneatPromedio: 118,
    precioUsdHa: 4800, precioVentaUsd: 2688000, rentaUsdHaAnio: null,
    tipoOperacion: ["venta"], aptitud: ["agricola_ganadera"], esExclusiva: true,
  },
  {
    id: "9", referencia: "CA-0076", slug: "campo-pastoreo-rio-negro-ca-0076",
    titulo: "Pastoreo zafral — 400 ha de campo natural",
    departamento: "rio_negro", paraje: "Young",
    superficieHa: 400, coneatPromedio: 82,
    precioUsdHa: 0, precioVentaUsd: null, rentaUsdHaAnio: 140,
    tipoOperacion: ["pastoreo"], aptitud: ["ganadera"], esExclusiva: false,
  },
  {
    id: "10", referencia: "CA-0160", slug: "campo-lechero-san-jose-ca-0160",
    titulo: "Establecimiento lechero con galpones y sala de frío",
    departamento: "san_jose", paraje: "Rodríguez",
    superficieHa: 270, coneatPromedio: 125,
    precioUsdHa: 6200, precioVentaUsd: 1674000, rentaUsdHaAnio: null,
    tipoOperacion: ["venta"], aptitud: ["lechera"], esExclusiva: true,
  },
  {
    id: "11", referencia: "CA-0038", slug: "campo-ganadero-artigas-ca-0038",
    titulo: "Basalto profundo — campo ganadero al norte",
    departamento: "artigas", paraje: "Bella Unión",
    superficieHa: 3200, coneatPromedio: 71,
    precioUsdHa: 1650, precioVentaUsd: 5280000, rentaUsdHaAnio: null,
    tipoOperacion: ["venta"], aptitud: ["ganadera"], esExclusiva: false,
  },
  {
    id: "12", referencia: "CA-0131", slug: "campo-lavalleja-ca-0131",
    titulo: "Campo mixto con monte nativo y arroyo",
    departamento: "lavalleja", paraje: "Minas",
    superficieHa: 740, coneatPromedio: 91,
    precioUsdHa: 2600, precioVentaUsd: 1924000, rentaUsdHaAnio: null,
    tipoOperacion: ["venta", "arrendamiento"], aptitud: ["mixta"], esExclusiva: false,
  },
];

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

const DEPT_DISPLAY: Record<string, string> = {
  artigas: "Artigas", canelones: "Canelones", cerro_largo: "Cerro Largo",
  colonia: "Colonia", durazno: "Durazno", flores: "Flores", florida: "Florida",
  lavalleja: "Lavalleja", maldonado: "Maldonado", montevideo: "Montevideo",
  paysandu: "Paysandú", rio_negro: "Río Negro", rivera: "Rivera", rocha: "Rocha",
  salto: "Salto", san_jose: "San José", soriano: "Soriano",
  tacuarembo: "Tacuarembó", treinta_y_tres: "Treinta y Tres",
};

function coneatColor(idx: number) {
  if (idx >= 120) return "text-emerald-700 bg-emerald-50";
  if (idx >= 90)  return "text-campo bg-green-50";
  if (idx >= 70)  return "text-trigal bg-amber-50";
  return "text-piedra bg-crema";
}

// ─── Filtrado ────────────────────────────────────────────────────────────────

type SearchParams = {
  departamento?: string; tipo?: string;
  ha_min?: string; ha_max?: string;
  precio_max?: string; coneat_min?: string;
  aptitud?: string;
};

function filtrar(campos: Campo[], sp: SearchParams): Campo[] {
  return campos.filter((c) => {
    if (sp.departamento && c.departamento !== sp.departamento) return false;
    if (sp.tipo && !c.tipoOperacion.includes(sp.tipo)) return false;
    if (sp.ha_min && c.superficieHa < Number(sp.ha_min)) return false;
    if (sp.ha_max && c.superficieHa > Number(sp.ha_max)) return false;
    if (sp.precio_max && c.precioUsdHa > Number(sp.precio_max)) return false;
    if (sp.coneat_min && c.coneatPromedio < Number(sp.coneat_min)) return false;
    if (sp.aptitud) {
      const ap = sp.aptitud.split(",");
      if (!ap.some((a) => c.aptitud.includes(a))) return false;
    }
    return true;
  });
}

// ─── Campo Card ───────────────────────────────────────────────────────────────

function CampoCard({ c }: { c: Campo }) {
  const precioPrincipal = c.tipoOperacion.includes("venta") && c.precioUsdHa > 0
    ? { label: "USD/ha", value: fmtN(c.precioUsdHa) }
    : c.rentaUsdHaAnio
    ? { label: "USD/ha/año", value: fmtN(c.rentaUsdHaAnio) }
    : null;

  return (
    <Link
      href={`/campos/${c.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-crema hover:border-trigal hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Imagen placeholder */}
      <div className="relative h-44 bg-gradient-to-br from-campo/20 via-campo/10 to-crema overflow-hidden">
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
          {c.paraje} · {DEPT_DISPLAY[c.departamento] ?? c.departamento}
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
            <p className={`font-mono text-base font-semibold leading-none px-1 rounded ${coneatColor(c.coneatPromedio)}`}>
              {c.coneatPromedio}
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
  const resultados = filtrar(TODOS_LOS_CAMPOS, sp);

  // Ordenar
  const orden = sp.orden ?? "reciente";
  const ordenados = [...resultados].sort((a, b) => {
    if (orden === "ha_desc")     return b.superficieHa - a.superficieHa;
    if (orden === "ha_asc")      return a.superficieHa - b.superficieHa;
    if (orden === "precio_asc")  return (a.precioUsdHa || Infinity) - (b.precioUsdHa || Infinity);
    if (orden === "precio_desc") return (b.precioUsdHa || 0) - (a.precioUsdHa || 0);
    if (orden === "coneat_desc") return b.coneatPromedio - a.coneatPromedio;
    return 0;
  });

  const hayFiltros = !!(sp.departamento || sp.tipo || sp.ha_min || sp.ha_max || sp.precio_max || sp.coneat_min || sp.aptitud);

  return (
    <>
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-crema">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center gap-8">
          <Link href="/" className="font-display text-xl font-semibold text-campo shrink-0">
            Inmobiliaria Rural
          </Link>
          <div className="hidden md:flex gap-6 text-sm text-tierra/70">
            <Link href="/campos" className="text-campo font-semibold">Campos</Link>
            <Link href="/nosotros" className="hover:text-tierra transition-colors">Nosotros</Link>
            <Link href="/contacto" className="hover:text-tierra transition-colors">Contacto</Link>
          </div>
          <div className="ml-auto">
            <Link
              href="/contacto"
              className="rounded-lg bg-campo px-4 py-2 text-sm font-semibold text-white hover:bg-campo/90 transition-colors"
            >
              Publicar campo
            </Link>
          </div>
        </div>
      </nav>

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

            {ordenados.length === 0 ? (
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
                {ordenados.map((c) => (
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
    </>
  );
}
