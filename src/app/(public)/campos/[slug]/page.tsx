import Link from "next/link";
import { notFound } from "next/navigation";
import { CTAContactoSidebar, CTAFlotanteMobile } from "@/components/campo/CTAContacto";
import { getNonce } from "@/lib/nonce";
import { obtenerUbicacionPublica, type UbicacionPublica } from "@/lib/ubicacion-publica";
import {
  getCampoDetallePorSlug,
  getCamposSimilares,
  type CampoDetalle,
  type CampoResumen,
} from "@/lib/campos-publico";
import { DEPARTAMENTO_LABEL } from "@/lib/departamentos";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const APTITUD: Record<string, string> = {
  ganadera: "Ganadero", agricola: "Agrícola", agricola_ganadera: "Agrícola-Ganadero",
  lechera: "Lechero", forestal: "Forestal", arrocera: "Arrocero", hortifruticola: "Hortifrutícola",
};
const TIPO_AGUA: Record<string, string> = {
  arroyo: "Arroyo", canada: "Cañada", frente_rio: "Frente de río", tajamar: "Tajamar",
  represa: "Represa", pozo_semisurgente: "Pozo semisurgente", pozo_surgente: "Pozo surgente",
  molino: "Molino", bomba: "Bomba", bebedero: "Bebedero",
};
const TIPO_MEJORA: Record<string, string> = {
  casco: "Casco / Casa principal", casa_personal: "Casa personal", galpon: "Galpón",
  silo: "Silo", balanza: "Balanza", brete: "Brete", corral: "Corral", tubo: "Tubo",
  manga: "Manga", banadera: "Bañadera", sala_ordene: "Sala de ordeñe", otro: "Otro",
};
const ENERGIA: Record<string, string> = {
  en_predio_trifasica: "Trifásica en predio",
  en_predio_monofasica: "Monofásica en predio",
  linea_a_menos_1km: "Línea a menos de 1 km",
  sin_ute: "Sin energía eléctrica",
};
const ACCESO_LABEL: Record<string, string> = {
  ruta_nacional: "Ruta nacional", camino_departamental_balastro: "Dep. balastro", camino_vecinal: "Vecinal",
};
const ESTADO_COLOR: Record<string, string> = {
  nuevo: "text-campo bg-green-50", bueno: "text-campo bg-green-50",
  regular: "text-amber-700 bg-amber-50", a_reparar: "text-red-700 bg-red-50",
};

function fmtN(n: number, dec = 0) {
  return new Intl.NumberFormat("es-UY", { maximumFractionDigits: dec }).format(n);
}
function fmtUsd(n: number) { return "USD " + fmtN(n); }
function fmtHa(n: number) { return fmtN(n, 0) + " ha"; }

function coneatColor(idx: number) {
  if (idx >= 120) return "text-campo font-bold";
  if (idx >= 100) return "text-campo";
  if (idx >= 80) return "text-tierra";
  return "text-amber-600";
}

// ─── Sub-componentes (servidor) ───────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 font-display text-2xl font-semibold text-tierra mb-6">
      <span className="block w-1 h-6 rounded-full bg-trigal shrink-0" aria-hidden />
      {children}
    </h2>
  );
}

function DataBadge({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-paja border border-crema rounded-xl px-4 py-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-piedra mb-0.5">{label}</p>
      <p className={`text-tierra font-medium leading-snug ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const cls = ESTADO_COLOR[estado] ?? "text-piedra bg-crema";
  const labels: Record<string, string> = { nuevo: "Nuevo", bueno: "Bueno", regular: "Regular", a_reparar: "A reparar" };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${cls}`}>
      {labels[estado] ?? estado}
    </span>
  );
}

// ─── Secciones de contenido ───────────────────────────────────────────────────

function SeccionGaleria({ campo }: { campo: CampoDetalle }) {
  const fotos = campo.media.filter((m) => m.tipo === "foto" || m.tipo === "foto_drone");

  if (fotos.length === 0) {
    return (
      <section className="mb-8">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-80 rounded-2xl overflow-hidden">
          <div className="col-span-4 row-span-2 bg-campo relative flex items-center justify-center">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 21px)" }}
            />
            <div className="text-center">
              <p className="font-mono text-white/40 text-xs mb-1">{campo.referencia}</p>
              <p className="text-white/25 text-sm">Fotos disponibles al consultar</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const [principal, ...resto] = fotos;

  return (
    <section className="mb-8">
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-80 rounded-2xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={principal.url}
          alt={principal.altText ?? campo.titulo}
          className="col-span-3 row-span-2 w-full h-full object-cover"
        />
        {resto.slice(0, 4).map((foto) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={foto.id}
            src={foto.urlThumb ?? foto.url}
            alt={foto.altText ?? campo.titulo}
            className="w-full h-full object-cover"
          />
        ))}
      </div>
    </section>
  );
}

function SeccionDatosProductivos({ campo }: { campo: CampoDetalle }) {
  const totalDesglose = campo.desgloseConeat.reduce((s, d) => s + d.hectareas, 0);

  const usoSuelo = [
    { label: "Campo natural", ha: campo.haCampoNatural, color: "#4A7C2F" },
    { label: "Laborable", ha: campo.haLaborable, color: "#A8881C" },
    { label: "Praderas", ha: campo.haPraderas, color: "#7BAF4A" },
    { label: "Monte nativo", ha: campo.haMonteNativo, color: "#2D5A1B" },
    { label: "Forestado", ha: campo.haForestado, color: "#8A9A7A" },
  ].filter((u) => u.ha && u.ha > 0) as { label: string; ha: number; color: string }[];

  const totalUso = usoSuelo.reduce((s, u) => s + u.ha, 0);

  return (
    <section className="py-8 border-b border-crema">
      <SectionTitle>Datos productivos</SectionTitle>

      {/* Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {campo.aptitud.map((a) => (
          <DataBadge key={a} label="Aptitud" value={APTITUD[a] ?? a} />
        ))}
        {campo.dotacionHistoricaUgHa && (
          <DataBadge label="Dotación histórica" value={`${campo.dotacionHistoricaUgHa} UG/ha`} mono />
        )}
        {campo.pctPrioridadForestal && (
          <DataBadge label="Prioridad forestal" value={`${campo.pctPrioridadForestal}%`} mono />
        )}
      </div>

      {/* Desglose CONEAT */}
      <h3 className="text-sm font-semibold text-tierra mb-3">Desglose CONEAT por grupo de suelo</h3>
      <div className="rounded-xl border border-crema overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-crema/60">
            <tr>
              <th className="text-left px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra">Grupo</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra">Índice</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra">Hectáreas</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra">% campo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-crema bg-white">
            {campo.desgloseConeat.map((d) => (
              <tr key={d.grupoSuelo} className="hover:bg-paja transition-colors">
                <td className="px-4 py-3 font-mono text-tierra">{d.grupoSuelo}</td>
                <td className={`px-4 py-3 font-mono text-right ${coneatColor(d.indice)}`}>{fmtN(d.indice, 1)}</td>
                <td className="px-4 py-3 font-mono text-right text-tierra">{fmtHa(d.hectareas)}</td>
                <td className="px-4 py-3 font-mono text-right text-piedra">
                  {fmtN((d.hectareas / totalDesglose) * 100, 1)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-crema/40 border-t border-crema">
            <tr>
              <td className="px-4 py-3 text-[11px] font-mono uppercase text-piedra">Promedio ponderado</td>
              <td className={`px-4 py-3 font-mono text-right font-bold ${campo.coneatPromedio != null ? coneatColor(campo.coneatPromedio) : "text-piedra"}`}>
                {campo.coneatPromedio != null ? fmtN(campo.coneatPromedio, 1) : "—"}
              </td>
              <td className="px-4 py-3 font-mono text-right font-medium text-tierra">{fmtHa(campo.superficieHa)}</td>
              <td className="px-4 py-3 font-mono text-right text-piedra">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Uso del suelo */}
      {totalUso > 0 && (
        <>
          <h3 className="text-sm font-semibold text-tierra mb-3">Uso del suelo</h3>
          <div className="flex h-7 rounded-lg overflow-hidden mb-3 gap-px">
            {usoSuelo.map((u) => (
              <div
                key={u.label}
                style={{ width: `${(u.ha / totalUso) * 100}%`, backgroundColor: u.color }}
                title={`${u.label}: ${fmtHa(u.ha)}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {usoSuelo.map((u) => (
              <div key={u.label} className="flex items-center gap-1.5 text-sm text-tierra">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: u.color }} />
                <span>{u.label}</span>
                <span className="font-mono text-piedra">{fmtHa(u.ha)}</span>
                <span className="text-piedra text-xs">({fmtN((u.ha / totalUso) * 100, 1)}%)</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function SeccionAgua({ campo }: { campo: CampoDetalle }) {
  return (
    <section className="py-8 border-b border-crema">
      <SectionTitle>Agua</SectionTitle>

      <div className="rounded-xl border border-crema overflow-hidden bg-white mb-4">
        <table className="w-full text-sm">
          <thead className="bg-crema/60">
            <tr>
              <th className="text-left px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra">Fuente</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra">Cantidad</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra">Estado</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra hidden sm:table-cell">Observaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-crema">
            {campo.fuentesAgua.map((f, i) => (
              <tr key={i} className="hover:bg-paja transition-colors">
                <td className="px-4 py-3 font-medium text-tierra">{TIPO_AGUA[f.tipo] ?? f.tipo}</td>
                <td className="px-4 py-3 font-mono text-right text-tierra">{f.cantidad}</td>
                <td className="px-4 py-3">
                  {f.estado ? <EstadoBadge estado={f.estado} /> : <span className="text-piedra">—</span>}
                </td>
                <td className="px-4 py-3 text-piedra hidden sm:table-cell">{f.observaciones ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {campo.tieneDerechoRiego && (
        <div className="flex items-center gap-2 text-sm text-campo bg-green-50 rounded-lg px-4 py-3">
          <span>✓</span>
          <span className="font-medium">Tiene derecho de riego</span>
          {campo.haBajoRiego && <span className="text-piedra">— {fmtHa(campo.haBajoRiego)} bajo riego</span>}
        </div>
      )}
    </section>
  );
}

function SeccionMejoras({ campo }: { campo: CampoDetalle }) {
  return (
    <section className="py-8 border-b border-crema">
      <SectionTitle>Mejoras e infraestructura</SectionTitle>

      <div className="rounded-xl border border-crema overflow-hidden bg-white mb-6">
        <table className="w-full text-sm">
          <thead className="bg-crema/60">
            <tr>
              <th className="text-left px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra">Mejora</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra hidden sm:table-cell">Superficie</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra">Estado</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra hidden md:table-cell">Descripción</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider text-piedra hidden sm:table-cell">Antigüedad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-crema">
            {campo.mejoras.map((m, i) => (
              <tr key={i} className="hover:bg-paja transition-colors">
                <td className="px-4 py-3 font-medium text-tierra">{TIPO_MEJORA[m.tipo] ?? m.tipo}</td>
                <td className="px-4 py-3 font-mono text-right text-tierra hidden sm:table-cell">
                  {m.superficieM2 ? `${fmtN(m.superficieM2)} m²` : "—"}
                </td>
                <td className="px-4 py-3">
                  {m.estado ? <EstadoBadge estado={m.estado} /> : <span className="text-piedra">—</span>}
                </td>
                <td className="px-4 py-3 text-piedra hidden md:table-cell">{m.descripcion ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-right text-piedra hidden sm:table-cell">
                  {m.antiguedadAnios ? `${m.antiguedadAnios} años` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alambrado */}
      <h3 className="text-sm font-semibold text-tierra mb-3">Alambrado</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {campo.alambradoPerimetralEstado && (
          <DataBadge label="Perimetral" value={campo.alambradoPerimetralEstado.charAt(0).toUpperCase() + campo.alambradoPerimetralEstado.slice(1)} />
        )}
        {campo.alambradoDivisorioEstado && (
          <DataBadge label="Divisorio" value={campo.alambradoDivisorioEstado.charAt(0).toUpperCase() + campo.alambradoDivisorioEstado.slice(1)} />
        )}
        {campo.cantidadPotreros && (
          <DataBadge label="Potreros" value={`${campo.cantidadPotreros}`} mono />
        )}
        {campo.kmAlambrado && (
          <DataBadge label="Total alambrado" value={`${fmtN(campo.kmAlambrado)} km`} mono />
        )}
      </div>
    </section>
  );
}

function SeccionAccesos({ campo }: { campo: CampoDetalle }) {
  return (
    <section className="py-8 border-b border-crema">
      <SectionTitle>Accesos y servicios</SectionTitle>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {campo.acceso && (
          <DataBadge label="Tipo de caminería" value={ACCESO_LABEL[campo.acceso] ?? campo.acceso} />
        )}
        {campo.kmARuta != null && (
          <DataBadge label="Distancia a ruta" value={`${fmtN(campo.kmARuta, 1)} km`} mono />
        )}
        {campo.kmACentroPoblado != null && campo.centroPobladoReferencia && (
          <DataBadge label={`Distancia a ${campo.centroPobladoReferencia}`} value={`${fmtN(campo.kmACentroPoblado, 1)} km`} mono />
        )}
        {campo.energia && (
          <DataBadge label="Energía eléctrica" value={ENERGIA[campo.energia] ?? campo.energia} />
        )}
      </div>

      {campo.accesoTodoTiempo && (
        <div className="flex items-center gap-2 text-sm text-campo bg-green-50 rounded-lg px-4 py-3 w-fit">
          <span>✓</span>
          <span className="font-medium">Acceso todo tiempo</span>
        </div>
      )}
    </section>
  );
}

function SeccionMapa({ campo, ubicacion }: { campo: CampoDetalle; ubicacion: UbicacionPublica }) {
  // La geometría/centroide real nunca llegan a este componente salvo en
  // modo 'exacta' — ubicacion ya viene filtrada por obtenerUbicacionPublica.
  const msgs = {
    exacta: {
      label: "Polígono real",
      desc: "La ubicación exacta del campo está disponible en el mapa.",
      color: "text-campo",
    },
    aproximada: {
      label: "Ubicación aproximada",
      desc: `Círculo centrado en un punto desplazado aleatoriamente, radio ${Math.round(
        (ubicacion.modo === "aproximada" ? ubicacion.radioM : 3000) / 1000
      )} km. Solicitá la ubicación exacta al consultar.`,
      color: "text-amber-700",
    },
    oculta: {
      label: "Ubicación reservada",
      desc: "Por decisión del propietario, la ubicación no se publica. Consultá para más información.",
      color: "text-piedra",
    },
  }[ubicacion.modo];

  return (
    <section className="py-8 border-b border-crema">
      <SectionTitle>Mapa</SectionTitle>

      {/* Placeholder — se reemplaza con <MapLibreGL /> cuando esté integrado */}
      <div className="relative rounded-2xl overflow-hidden bg-campo h-80 flex flex-col items-center justify-center">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 40% 50%, rgba(168,136,28,0.4) 0%, transparent 50%), repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(255,255,255,0.04) 29px, rgba(255,255,255,0.04) 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(255,255,255,0.04) 29px, rgba(255,255,255,0.04) 30px)" }} />
        <div className="relative text-center px-6">
          <p className={`font-mono text-xs uppercase tracking-wider mb-2 ${msgs.color}`}>{msgs.label}</p>
          <p className="text-white/50 text-sm max-w-xs">{msgs.desc}</p>
          <p className="text-white/20 text-xs mt-4 font-mono">
            {DEPARTAMENTO_LABEL[campo.departamento] ?? campo.departamento} · {campo.paraje}
          </p>
        </div>
      </div>

      <p className="text-piedra text-xs mt-3">
        El mapa satelital con capas CONEAT, suelos y polígono estará disponible próximamente.
      </p>
    </section>
  );
}

function SimilarCard({ c }: { c: CampoResumen }) {
  return (
    <Link
      href={`/campos/${c.slug}`}
      className="group flex flex-col bg-white rounded-xl border border-crema p-5 hover:border-trigal/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-tierra">{DEPARTAMENTO_LABEL[c.departamento] ?? c.departamento}</p>
          <p className="text-piedra text-sm">{c.paraje}</p>
        </div>
        <span className="font-mono text-xs text-piedra">{c.referencia}</span>
      </div>
      <div className="flex gap-4 text-sm mb-3">
        <div>
          <p className="text-[10px] font-mono uppercase text-piedra">Sup.</p>
          <p className="font-mono font-medium text-tierra">{fmtHa(c.superficieHa)}</p>
        </div>
        {c.coneatPromedio != null && (
          <div>
            <p className="text-[10px] font-mono uppercase text-piedra">CNEAT</p>
            <p className={`font-mono font-medium ${coneatColor(c.coneatPromedio)}`}>{c.coneatPromedio}</p>
          </div>
        )}
        {c.aptitud[0] && (
          <div>
            <p className="text-[10px] font-mono uppercase text-piedra">Aptitud</p>
            <p className="text-tierra text-sm">{APTITUD[c.aptitud[0]] ?? c.aptitud[0]}</p>
          </div>
        )}
      </div>
      <p className="font-display text-xl font-semibold text-trigal mt-auto">
        {c.precioUsdHa != null ? `USD ${fmtN(c.precioUsdHa)}/ha` : "Consultar precio"}
      </p>
    </Link>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function CampoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const campo = await getCampoDetallePorSlug(slug);
  if (!campo) notFound();

  const nonce = await getNonce();
  const whatsappNumber = process.env.WHATSAPP_PHONE || undefined;

  const [ubicacion, similares] = await Promise.all([
    obtenerUbicacionPublica(campo.id),
    getCamposSimilares(campo.id, campo.departamento),
  ]);

  const esArrendamiento = campo.tipoOperacion.includes("arrendamiento");

  const precioDisplay = esArrendamiento && campo.rentaUsdHaAnio
    ? `USD ${fmtN(campo.rentaUsdHaAnio)}/ha·año`
    : campo.precioUsdHa != null
    ? `USD ${fmtN(campo.precioUsdHa)}/ha`
    : "Consultar precio";

  const precioTotal = campo.precioVentaUsd ? fmtUsd(campo.precioVentaUsd) : null;

  return (
    <div className="bg-[#FBF8F3] min-h-screen pb-24 lg:pb-0">

      {/* BREADCRUMB */}
      <nav aria-label="Ruta de navegación" className="border-b border-crema bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-1.5 text-sm text-piedra flex-wrap">
            <li><Link href="/" className="hover:text-tierra transition-colors">Inicio</Link></li>
            <li className="text-crema">›</li>
            <li><Link href="/campos" className="hover:text-tierra transition-colors">Campos</Link></li>
            <li className="text-crema">›</li>
            <li><Link href={`/campos?departamento=${campo.departamento}`} className="hover:text-tierra transition-colors">{DEPARTAMENTO_LABEL[campo.departamento] ?? campo.departamento}</Link></li>
            <li className="text-crema">›</li>
            <li className="text-tierra font-medium" aria-current="page">{campo.referencia}</li>
          </ol>
        </div>
      </nav>

      {/* BANNER VENDIDO/RESERVADO — la ficha se mantiene accesible (nunca
          404) para no perder enlaces entrantes; spec sección 9 */}
      {(campo.estadoPublicacion === "vendido" || campo.estadoPublicacion === "reservado") && (
        <div className={`py-2.5 text-center text-sm font-semibold text-white ${campo.estadoPublicacion === "vendido" ? "bg-piedra" : "bg-amber-600"}`}>
          {campo.estadoPublicacion === "vendido" ? "Vendido" : "Reservado"} — esta ficha se conserva a modo de referencia
        </div>
      )}

      {/* ENCABEZADO */}
      <div className="bg-white border-b border-crema">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

          {/* Badges de estado */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="font-mono text-xs text-piedra bg-paja rounded-full px-3 py-1 border border-crema">
              {campo.referencia}
            </span>
            {campo.esExclusiva && (
              <span className="text-xs font-semibold text-trigal bg-trigal/10 rounded-full px-3 py-1">
                Exclusiva
              </span>
            )}
            {campo.tipoOperacion.map((t) => (
              <span key={t} className="text-xs font-semibold text-white bg-trigal rounded-full px-3 py-1 capitalize">
                {t === "arrendamiento" ? "Arrendamiento" : t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            ))}
            {campo.estadoOcupacion === "arrendado" && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 rounded-full px-3 py-1">
                Actualmente arrendado
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-tierra mb-1 leading-tight">
            {campo.titulo}
          </h1>
          <p className="text-piedra mb-6">
            {DEPARTAMENTO_LABEL[campo.departamento] ?? campo.departamento} · {campo.paraje}
            {campo.seccionPolicial && ` · Sección policial ${campo.seccionPolicial}`}
            {campo.seccionJudicial && ` · Judicial ${campo.seccionJudicial}`}
          </p>

          {/* Métricas principales */}
          <div className="flex flex-wrap items-end gap-8">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-piedra mb-1">Superficie</p>
              <p className="font-mono text-2xl font-bold text-tierra">{fmtHa(campo.superficieHa)}</p>
            </div>
            {campo.coneatPromedio != null && (
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-piedra mb-1">CONEAT promedio</p>
                <p className={`font-mono text-2xl font-bold ${coneatColor(campo.coneatPromedio)}`}>{fmtN(campo.coneatPromedio, 1)}</p>
              </div>
            )}
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-piedra mb-1">Aptitud</p>
              <p className="text-tierra text-lg font-medium">{campo.aptitud.map((a) => APTITUD[a] ?? a).join(", ")}</p>
            </div>

            {/* Precio destacado */}
            <div className="ml-auto text-right">
              <p className="text-[11px] font-mono uppercase tracking-wider text-piedra mb-1">Precio</p>
              <p className="font-display text-4xl font-semibold text-trigal leading-none">{precioDisplay}</p>
              {precioTotal && (
                <p className="text-piedra text-base mt-1">{precioTotal} total</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CUERPO 2 COLUMNAS */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">

          {/* COLUMNA IZQUIERDA */}
          <div>
            <SeccionGaleria campo={campo} />
            <SeccionDatosProductivos campo={campo} />
            <SeccionAgua campo={campo} />
            <SeccionMejoras campo={campo} />
            <SeccionAccesos campo={campo} />
            <SeccionMapa campo={campo} ubicacion={ubicacion} />

            {/* Descargo legal */}
            <p className="mt-8 text-xs text-piedra leading-relaxed bg-crema/50 rounded-lg px-4 py-3">
              La información publicada (superficies, índices CONEAT, mejoras) proviene del propietario y fuentes de terceros. Corresponde verificación por parte del interesado antes de concretar cualquier operación.
            </p>
          </div>

          {/* COLUMNA DERECHA — sticky */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <CTAContactoSidebar
                referencia={campo.referencia}
                campoId={campo.id}
                precioDisplay={precioDisplay}
                precioTotal={precioTotal}
                whatsappNumber={whatsappNumber}
                nonce={nonce}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* CAMPOS SIMILARES */}
      {similares.length > 0 && (
        <section className="bg-crema/50 border-t border-crema py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-trigal mb-2">Podría interesarte</p>
              <h2 className="font-display text-3xl font-semibold text-tierra">Campos similares</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similares.map((c) => <SimilarCard key={c.id} c={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="hero-bg border-t border-white/10 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="font-display text-xl font-semibold text-white">
            Inmobiliaria Rural
          </Link>
          <p className="text-white/30 text-xs font-mono">
            © {new Date().getFullYear()} Inmobiliaria Rural · Todos los derechos reservados
          </p>
        </div>
      </footer>

      {/* CTA FLOTANTE MOBILE */}
      <CTAFlotanteMobile
        referencia={campo.referencia}
        campoId={campo.id}
        precioDisplay={precioDisplay}
        whatsappNumber={whatsappNumber}
      />
    </div>
  );
}
