import Link from "next/link";
import BuscadorHome from "@/components/ui/BuscadorHome";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Campo = {
  id: string;
  referencia: string;
  departamento: string;
  paraje: string;
  superficieHa: number;
  coneatPromedio: number;
  precioUsdHa: number;
  precioVentaUsd: number | null;
  tipoOperacion: string[];
  aptitud: string[];
  slug: string;
  rentaUsdHaAnio?: number;
};

// ─── Mock data (se reemplaza con consultas a DB) ──────────────────────────────

const CAMPOS_DESTACADOS: Campo[] = [
  {
    id: "1", referencia: "CA-0042",
    departamento: "Tacuarembó", paraje: "Paso de los Toros",
    superficieHa: 450, coneatPromedio: 95,
    precioUsdHa: 3200, precioVentaUsd: 1440000,
    tipoOperacion: ["venta"], aptitud: ["ganadera"],
    slug: "campo-ganadero-tacuarembo-ca-0042",
  },
  {
    id: "2", referencia: "CA-0087",
    departamento: "Paysandú", paraje: "Chapicuy",
    superficieHa: 820, coneatPromedio: 112,
    precioUsdHa: 2800, precioVentaUsd: 2296000,
    tipoOperacion: ["venta"], aptitud: ["agricola_ganadera"],
    slug: "campo-agricola-ganadero-paysandu-ca-0087",
  },
  {
    id: "3", referencia: "CA-0031",
    departamento: "Soriano", paraje: "Cardona",
    superficieHa: 1240, coneatPromedio: 108,
    precioUsdHa: 4100, precioVentaUsd: 5084000,
    tipoOperacion: ["venta"], aptitud: ["agricola"],
    slug: "campo-agricola-soriano-ca-0031",
  },
  {
    id: "4", referencia: "CA-0118",
    departamento: "Colonia", paraje: "Tarariras",
    superficieHa: 320, coneatPromedio: 130,
    precioUsdHa: 5600, precioVentaUsd: 1792000,
    tipoOperacion: ["venta"], aptitud: ["lechera"],
    slug: "campo-lechero-colonia-ca-0118",
  },
  {
    id: "5", referencia: "CA-0067",
    departamento: "Durazno", paraje: "Santa Bernardina",
    superficieHa: 680, coneatPromedio: 88,
    precioUsdHa: 0, precioVentaUsd: null,
    tipoOperacion: ["arrendamiento"], aptitud: ["ganadera"],
    slug: "campo-ganadero-durazno-ca-0067",
    rentaUsdHaAnio: 180,
  },
  {
    id: "6", referencia: "CA-0093",
    departamento: "Río Negro", paraje: "Young",
    superficieHa: 950, coneatPromedio: 118,
    precioUsdHa: 3700, precioVentaUsd: 3515000,
    tipoOperacion: ["venta"], aptitud: ["arrocera"],
    slug: "campo-arrocero-rio-negro-ca-0093",
  },
];

const ULTIMOS_INGRESOS: Campo[] = [
  {
    id: "7", referencia: "CA-0144",
    departamento: "Rivera", paraje: "Tranqueras",
    superficieHa: 1800, coneatPromedio: 72,
    precioUsdHa: 1950, precioVentaUsd: 3510000,
    tipoOperacion: ["venta"], aptitud: ["ganadera", "forestal"],
    slug: "campo-ganadero-forestal-rivera-ca-0144",
  },
  {
    id: "8", referencia: "CA-0139",
    departamento: "Florida", paraje: "Casupá",
    superficieHa: 510, coneatPromedio: 104,
    precioUsdHa: 3400, precioVentaUsd: 1734000,
    tipoOperacion: ["venta"], aptitud: ["agricola_ganadera"],
    slug: "campo-agricola-florida-ca-0139",
  },
  {
    id: "9", referencia: "CA-0136",
    departamento: "Salto", paraje: "Constitución",
    superficieHa: 2200, coneatPromedio: 81,
    precioUsdHa: 0, precioVentaUsd: null,
    tipoOperacion: ["arrendamiento"], aptitud: ["ganadera"],
    slug: "campo-ganadero-salto-ca-0136",
    rentaUsdHaAnio: 145,
  },
  {
    id: "10", referencia: "CA-0133",
    departamento: "Cerro Largo", paraje: "Melo",
    superficieHa: 720, coneatPromedio: 91,
    precioUsdHa: 2600, precioVentaUsd: 1872000,
    tipoOperacion: ["venta"], aptitud: ["ganadera"],
    slug: "campo-ganadero-cerro-largo-ca-0133",
  },
  {
    id: "11", referencia: "CA-0131",
    departamento: "Lavalleja", paraje: "Minas",
    superficieHa: 380, coneatPromedio: 97,
    precioUsdHa: 3100, precioVentaUsd: 1178000,
    tipoOperacion: ["venta"], aptitud: ["agricola_ganadera"],
    slug: "campo-agricola-lavalleja-ca-0131",
  },
];

const DEPARTAMENTOS = [
  "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno",
  "Flores", "Florida", "Lavalleja", "Maldonado", "Montevideo",
  "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto",
  "San José", "Soriano", "Tacuarembó", "Treinta y Tres",
];

const INFORMES = [
  {
    id: "1",
    tipo: "Informe de mercado",
    titulo: "Precios por departamento — Q1 2025",
    extracto: "Análisis de transacciones del primer trimestre. Tacuarembó y Paysandú lideran el volumen con variaciones de hasta 8% interanual.",
    fecha: "Marzo 2025",
    slug: "precios-departamento-q1-2025",
  },
  {
    id: "2",
    tipo: "Análisis técnico",
    titulo: "Cómo leer el CONEAT y su impacto en el precio",
    extracto: "Guía práctica para interpretar el índice de productividad de suelos y su relación directa con el valor de mercado del campo.",
    fecha: "Febrero 2025",
    slug: "guia-coneat-impacto-precio",
  },
  {
    id: "3",
    tipo: "Mercado",
    titulo: "Arrendamiento vs. compra: análisis financiero 2025",
    extracto: "Comparativa de rentabilidades según aptitud, zona y capital disponible. Incluye casos tipo con datos reales de mercado.",
    fecha: "Enero 2025",
    slug: "arrendamiento-vs-compra-2025",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtHa(n: number) {
  return new Intl.NumberFormat("es-UY").format(n) + " ha";
}

function fmtUsd(n: number) {
  return "USD " + new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 }).format(n);
}

function slugDpto(d: string) {
  return d.toLowerCase()
    .replace(/\s/g, "_")
    .replace(/[áà]/g, "a").replace(/[éè]/g, "e")
    .replace(/[íì]/g, "i").replace(/[óò]/g, "o")
    .replace(/[úù]/g, "u");
}

const APTITUD_LABEL: Record<string, string> = {
  ganadera: "Ganadero",
  agricola: "Agrícola",
  agricola_ganadera: "Agr.–Ganadero",
  lechera: "Lechero",
  forestal: "Forestal",
  arrocera: "Arrocero",
  hortifruticola: "Hortifrutícola",
};

// ─── Componente de tarjeta ────────────────────────────────────────────────────

function CampoCard({ campo }: { campo: Campo }) {
  const esArrendamiento = campo.tipoOperacion.includes("arrendamiento");

  return (
    <Link
      href={`/campos/${campo.slug}`}
      className="group flex flex-col bg-white rounded-xl overflow-hidden border border-crema shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Foto placeholder */}
      <div className="relative h-44 bg-campo flex items-end justify-between p-3">
        <span className="font-mono text-xs text-white/50">{campo.referencia}</span>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            esArrendamiento
              ? "bg-white/15 text-white border border-white/30"
              : "bg-trigal text-white"
          }`}
        >
          {esArrendamiento ? "Arrendamiento" : "Venta"}
        </span>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-4">
        {/* Ubicación */}
        <div className="mb-3">
          <p className="font-semibold text-tierra leading-tight">{campo.departamento}</p>
          <p className="text-piedra text-sm">{campo.paraje}</p>
        </div>

        {/* Datos técnicos */}
        <div className="flex gap-5 pb-3 mb-3 border-b border-crema">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-piedra mb-0.5">Superficie</p>
            <p className="font-mono text-sm font-medium text-tierra">{fmtHa(campo.superficieHa)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-piedra mb-0.5">CONEAT</p>
            <p className={`font-mono text-sm font-medium ${campo.coneatPromedio >= 100 ? "text-campo" : "text-tierra"}`}>
              {campo.coneatPromedio}
            </p>
          </div>
          {campo.aptitud[0] && (
            <div>
              <p className="text-[11px] uppercase tracking-wider text-piedra mb-0.5">Aptitud</p>
              <p className="text-sm text-tierra">{APTITUD_LABEL[campo.aptitud[0]] ?? campo.aptitud[0]}</p>
            </div>
          )}
        </div>

        {/* Precio — métrica estrella */}
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-wider text-piedra mb-1">
            {esArrendamiento ? "Renta anual" : "Precio"}
          </p>
          <p className="font-display text-[1.75rem] font-semibold leading-none text-trigal">
            {esArrendamiento && campo.rentaUsdHaAnio
              ? `USD ${campo.rentaUsdHaAnio.toLocaleString("es-UY")}/ha·año`
              : `USD ${campo.precioUsdHa.toLocaleString("es-UY")}/ha`}
          </p>
          {!esArrendamiento && campo.precioVentaUsd && (
            <p className="text-piedra text-sm mt-1">{fmtUsd(campo.precioVentaUsd)} total</p>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 pt-3 border-t border-crema">
          <span className="text-trigal text-sm font-semibold group-hover:underline">
            Ver ficha completa →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="bg-paja">

      {/* ── NAV ── */}
      <header className="hero-bg sticky top-0 z-50 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-2xl font-semibold text-white tracking-tight">
                Campos<span className="text-trigal">URY</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/campos" className="text-white/70 hover:text-white text-sm transition-colors">
                Campos
              </Link>
              <Link href="/informes" className="text-white/70 hover:text-white text-sm transition-colors">
                Informes
              </Link>
              <Link href="/quienes-somos" className="text-white/70 hover:text-white text-sm transition-colors">
                Quiénes somos
              </Link>
            </nav>
            <Link
              href="/contacto"
              className="rounded-lg bg-trigal px-4 py-2 text-sm font-semibold text-white hover:bg-[#8A6E14] transition-colors"
            >
              Publicar campo
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero-bg pt-16 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Titular */}
          <div className="max-w-3xl mb-12">
            <p className="text-trigal font-mono text-[13px] uppercase tracking-[0.15em] mb-4 animate-fade-up anim-delay-1">
              Plataforma de campos rurales · Uruguay
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.08] tracking-tight mb-5 animate-fade-up anim-delay-2">
              Campos con{" "}
              <em className="italic text-[#D4BC6A] not-italic" style={{ fontStyle: "italic" }}>
                datos para decidir.
              </em>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed animate-fade-up anim-delay-3">
              CONEAT desglosado · Polígono real sobre satelital · Infraestructura hídrica.{" "}
              <br className="hidden sm:block" />
              Lo que los portales generalistas no pueden darte.
            </p>
          </div>

          {/* Buscador */}
          <div className="animate-fade-up anim-delay-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15 max-w-4xl">
              <p className="text-white/50 text-[13px] font-mono uppercase tracking-wider mb-4">
                Buscá tu campo
              </p>
              <BuscadorHome />
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="mt-10 flex flex-wrap gap-8 animate-fade-up anim-delay-4">
            {[
              { val: "280+", label: "campos publicados" },
              { val: "19",   label: "departamentos" },
              { val: "CONEAT", label: "desglosado en cada ficha" },
              { val: "PDF",  label: "ficha técnica descargable" },
            ].map(({ val, label }) => (
              <div key={label}>
                <p className="font-mono text-xl font-medium text-[#D4BC6A]">{val}</p>
                <p className="text-white/50 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAMPOS DESTACADOS ── */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-trigal mb-2">
                Selección
              </p>
              <h2 className="font-display text-4xl font-semibold text-tierra">
                Campos destacados
              </h2>
            </div>
            <Link
              href="/campos"
              className="hidden sm:block text-trigal text-sm font-semibold hover:underline"
            >
              Ver todos los campos →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAMPOS_DESTACADOS.map((c) => (
              <CampoCard key={c.id} campo={c} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/campos"
              className="inline-block border border-trigal text-trigal rounded-lg px-6 py-3 text-sm font-semibold hover:bg-trigal hover:text-white transition-colors"
            >
              Ver todos los campos
            </Link>
          </div>
        </div>
      </section>

      {/* ── BÚSQUEDA POR DEPARTAMENTO ── */}
      <section className="bg-crema py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-trigal mb-2">
              Búsqueda rápida
            </p>
            <h2 className="font-display text-3xl font-semibold text-tierra">
              Por departamento
            </h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
            {DEPARTAMENTOS.map((d) => (
              <Link
                key={d}
                href={`/campos?departamento=${slugDpto(d)}`}
                className="group flex items-center justify-center rounded-lg border border-crema bg-white px-2 py-3 text-center text-[13px] font-medium text-tierra hover:border-trigal hover:text-trigal transition-colors min-h-[44px]"
              >
                {d}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── ÚLTIMOS INGRESOS ── */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-trigal mb-2">
                Recientes
              </p>
              <h2 className="font-display text-4xl font-semibold text-tierra">
                Últimos ingresos
              </h2>
            </div>
            <Link href="/campos?orden=reciente" className="hidden sm:block text-trigal text-sm font-semibold hover:underline">
              Ver todos →
            </Link>
          </div>

          <div className="divide-y divide-crema border-y border-crema">
            {ULTIMOS_INGRESOS.map((c) => {
              const esArr = c.tipoOperacion.includes("arrendamiento");
              return (
                <Link
                  key={c.id}
                  href={`/campos/${c.slug}`}
                  className="group flex items-center gap-4 py-4 hover:bg-white/60 rounded-lg px-3 -mx-3 transition-colors"
                >
                  {/* Ref + badge */}
                  <div className="w-20 shrink-0">
                    <span className="font-mono text-xs text-piedra">{c.referencia}</span>
                  </div>

                  {/* Ubicación */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-tierra truncate">
                      {c.departamento}
                      <span className="font-normal text-piedra"> · {c.paraje}</span>
                    </p>
                    <p className="text-piedra text-sm mt-0.5">
                      {APTITUD_LABEL[c.aptitud[0]] ?? c.aptitud[0]}
                    </p>
                  </div>

                  {/* Datos */}
                  <div className="hidden sm:flex items-center gap-8 shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-sm text-tierra">{fmtHa(c.superficieHa)}</p>
                      <p className="text-[11px] text-piedra">CNEAT {c.coneatPromedio}</p>
                    </div>
                    <div className="text-right w-36">
                      <p className="font-display text-xl font-semibold text-trigal leading-none">
                        {esArr && c.rentaUsdHaAnio
                          ? `USD ${c.rentaUsdHaAnio}/ha·año`
                          : `USD ${c.precioUsdHa.toLocaleString("es-UY")}/ha`}
                      </p>
                      <p className="text-[11px] text-piedra mt-0.5 capitalize">{esArr ? "arrendamiento" : "venta"}</p>
                    </div>
                  </div>

                  <span className="text-trigal text-sm hidden md:block shrink-0 group-hover:underline">
                    Ver →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA OFERTA ── */}
      <section className="bg-campo py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Texto */}
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-trigal mb-3">
                Captación de oferta
              </p>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white mb-5 leading-tight">
                ¿Tenés un campo para vender o arrendar?
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                Cargá tu campo con ficha técnica completa y llegá a compradores e inversores que buscan exactamente lo que vos tenés. Sin comisiones hasta cerrar el trato.
              </p>
              <ul className="space-y-3 text-white/80 text-sm">
                {[
                  "Ficha técnica descargable en PDF generada automáticamente",
                  "Polígono sobre mapa satelital con privacidad configurable",
                  "Distribución automática a portales (Gallito, InfoCasas, MercadoLibre)",
                  "Leads directamente a tu WhatsApp",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-trigal mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Formulario */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <h3 className="font-display text-2xl text-white mb-5">Publicar mi campo</h3>
              <form className="space-y-3">
                <div>
                  <label htmlFor="oferta-nombre" className="sr-only">Nombre</label>
                  <input
                    id="oferta-nombre"
                    type="text"
                    placeholder="Nombre y apellido"
                    className="w-full rounded-lg bg-white/15 border border-white/20 px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-trigal"
                  />
                </div>
                <div>
                  <label htmlFor="oferta-telefono" className="sr-only">Teléfono</label>
                  <input
                    id="oferta-telefono"
                    type="tel"
                    placeholder="Teléfono (WhatsApp)"
                    className="w-full rounded-lg bg-white/15 border border-white/20 px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-trigal"
                  />
                </div>
                <div>
                  <label htmlFor="oferta-departamento" className="sr-only">Departamento del campo</label>
                  <input
                    id="oferta-departamento"
                    type="text"
                    placeholder="Departamento del campo"
                    className="w-full rounded-lg bg-white/15 border border-white/20 px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-trigal"
                  />
                </div>
                <div>
                  <label htmlFor="oferta-mensaje" className="sr-only">Mensaje</label>
                  <textarea
                    id="oferta-mensaje"
                    rows={3}
                    placeholder="Contanos brevemente sobre el campo (superficie, tipo, precio estimado)"
                    className="w-full rounded-lg bg-white/15 border border-white/20 px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-trigal resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-trigal py-3.5 text-sm font-semibold text-white hover:bg-[#8A6E14] transition-colors"
                >
                  Quiero publicar mi campo
                </button>
                <p className="text-white/40 text-xs text-center">
                  O escribinos directamente por{" "}
                  <a href="https://wa.me/598XXXXXXXXX" className="underline text-white/60 hover:text-white">
                    WhatsApp
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── INFORMES DE MERCADO ── */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-trigal mb-2">
                Editorial
              </p>
              <h2 className="font-display text-4xl font-semibold text-tierra">
                Informes de mercado
              </h2>
            </div>
            <Link href="/informes" className="hidden sm:block text-trigal text-sm font-semibold hover:underline">
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {INFORMES.map((inf) => (
              <Link
                key={inf.id}
                href={`/informes/${inf.slug}`}
                className="group flex flex-col bg-white rounded-xl border border-crema p-6 hover:border-trigal/50 hover:shadow-sm transition-all"
              >
                <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-trigal mb-3">
                  {inf.tipo}
                </span>
                <h3 className="font-display text-xl font-semibold text-tierra mb-3 leading-snug group-hover:text-trigal transition-colors">
                  {inf.titulo}
                </h3>
                <p className="text-piedra text-sm leading-relaxed flex-1">
                  {inf.extracto}
                </p>
                <div className="mt-5 pt-4 border-t border-crema flex items-center justify-between">
                  <span className="text-piedra text-xs font-mono">{inf.fecha}</span>
                  <span className="text-trigal text-sm font-semibold group-hover:underline">Leer →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="hero-bg border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <Link href="/" className="inline-block mb-3">
                <span className="font-display text-2xl font-semibold text-white">
                  Campos<span className="text-trigal">URY</span>
                </span>
              </Link>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                La plataforma de comercialización de campos que compite por profundidad de datos, no por volumen de avisos.
              </p>
            </div>

            <div>
              <p className="text-white/30 text-[11px] font-mono uppercase tracking-wider mb-3">Plataforma</p>
              <ul className="space-y-2">
                {["Campos", "Comparador", "Búsquedas guardadas", "Informes"].map((l) => (
                  <li key={l}>
                    <Link href="#" className="text-white/60 hover:text-white text-sm transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-white/30 text-[11px] font-mono uppercase tracking-wider mb-3">Empresa</p>
              <ul className="space-y-2">
                {["Quiénes somos", "Contacto", "Publicar campo", "Política de privacidad"].map((l) => (
                  <li key={l}>
                    <Link href="#" className="text-white/60 hover:text-white text-sm transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/30 text-xs font-mono">
              © {new Date().getFullYear()} CamposURY. Todos los derechos reservados.
            </p>
            <p className="text-white/20 text-xs">
              La información publicada proviene del propietario y fuentes de terceros. Verificar antes de operar.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
