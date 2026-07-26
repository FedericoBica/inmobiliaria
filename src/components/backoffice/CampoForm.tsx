"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  CampoFormData,
  ConeatRow,
  FuenteRow,
  MejoraRow,
  PadronRow,
} from "@/app/(backoffice)/admin/(dashboard)/campos/actions";
import { crearCampo, actualizarCampo } from "@/app/(backoffice)/admin/(dashboard)/campos/actions";
import { slugify } from "@/lib/slugify";

// ─── Opciones ─────────────────────────────────────────────────────────────────

const DEPARTAMENTOS = [
  ["artigas","Artigas"],["canelones","Canelones"],["cerro_largo","Cerro Largo"],
  ["colonia","Colonia"],["durazno","Durazno"],["flores","Flores"],["florida","Florida"],
  ["lavalleja","Lavalleja"],["maldonado","Maldonado"],["montevideo","Montevideo"],
  ["paysandu","Paysandú"],["rio_negro","Río Negro"],["rivera","Rivera"],["rocha","Rocha"],
  ["salto","Salto"],["san_jose","San José"],["soriano","Soriano"],
  ["tacuarembo","Tacuarembó"],["treinta_y_tres","Treinta y Tres"],
] as const;

const APTITUDES = [
  ["agricola","Agrícola"],["ganadera","Ganadera"],["agricola_ganadera","Agrícola-Ganadera"],
  ["lechera","Lechera"],["forestal","Forestal"],["mixta","Mixta"],
] as const;

const TIPOS_OPERACION = [
  ["venta","Venta"],["arrendamiento","Arrendamiento"],["pastoreo","Pastoreo"],["permuta","Permuta"],
] as const;

const ENERGIA_OPS = [
  ["","—"],
  ["en_predio_trifasica","En predio trifásica"],["en_predio_monofasica","En predio monofásica"],
  ["linea_a_menos_1km","Línea a < 1 km"],["sin_ute","Sin UTE"],
] as const;

const ACCESO_OPS = [
  ["","—"],
  ["ruta_nacional","Ruta nacional"],
  ["camino_departamental_balastro","Camino depart. balastro"],
  ["camino_vecinal","Camino vecinal"],
] as const;

const OCUPACION_OPS = [
  ["","—"],
  ["libre","Libre"],["arrendado","Arrendado"],["pastoreo","Pastoreo"],["explotacion_propia","Explotación propia"],
] as const;

const ESTADO_MEJORA_OPS = [
  ["","—"],["nuevo","Nuevo"],["bueno","Bueno"],["regular","Regular"],["a_reparar","A reparar"],
] as const;

const FUENTE_AGUA_TIPOS = [
  ["arroyo","Arroyo"],["canada","Cañada"],["frente_rio","Frente de río"],["tajamar","Tajamar"],
  ["represa","Represa"],["pozo_semisurgente","Pozo semisurgente"],["pozo_surgente","Pozo surgente"],
  ["molino","Molino"],["bomba","Bomba"],["bebedero","Bebedero"],
] as const;

const MEJORA_TIPOS = [
  ["casco","Casco"],["casa_personal","Casa personal"],["galpon","Galpón"],["silo","Silo"],
  ["balanza","Balanza"],["brete","Brete"],["corral","Corral"],["tubo","Tubo"],
  ["manga","Manga"],["banadera","Bañadera"],["sala_ordene","Sala de ordeñe"],["otro","Otro"],
] as const;

const ESTADO_PUB_OPS = [
  ["borrador","Borrador"],["publicado","Publicado"],["reservado","Reservado"],
  ["vendido","Vendido"],["off_market","Off-market"],
] as const;

const PRECISION_OPS = [
  ["oculta","Oculta (no mostrar ubicación)"],
  ["aproximada","Aproximada (centroide desplazado)"],
  ["exacta","Exacta (polígono real)"],
] as const;

// ─── Valor inicial ─────────────────────────────────────────────────────────────

const INITIAL: CampoFormData = {
  referenciaInterna: "", titulo: "", slug: "", departamento: "", paraje: "",
  seccionJudicial: "", seccionPolicial: "",
  tipoOperacion: [], precioVentaUsd: "", precioAConsultar: false,
  rentaArrendamientoUsdHaAnio: "", precioPastoreo: "", unidadPastoreo: "",
  estadoOcupacion: "", fechaVencimientoContrato: "", esExclusiva: false,
  superficieHa: "", aptitud: [], dotacionHistoricaUgHa: "",
  pctPrioridadForestal: "", haLaborable: "", haCampoNatural: "",
  haPraderas: "", haMonteNativo: "", haForestado: "", desgloseConeat: [],
  energia: "", acceso: "", accesoTodoTiempo: null,
  kmARuta: "", kmACentroPoblado: "", centroPobladoReferencia: "",
  cantidadPotreros: "", kmAlambrado: "",
  alambradoPerimetralEstado: "", alambradoDivisorioEstado: "", padrones: [],
  tieneDerechoRiego: false, padronConPermisoRiego: "", haBajoRiego: "",
  fuentesAgua: [], mejoras: [],
  precisionUbicacion: "oculta", radioAproximacionM: "",
  estadoPublicacion: "borrador", destacado: false,
  notasInternas: "", estadoDominial: "", observacionesJuridicas: "",
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8881C] focus:border-[#A8881C]";
const selectCls = `${inputCls} appearance-none cursor-pointer`;
const labelCls = "block text-xs font-medium text-gray-600 mb-1";

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void;
  options: readonly (readonly [string, string])[]; required?: boolean;
}) {
  return (
    <Field label={label} required={required}>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
      </div>
    </Field>
  );
}

function NumField({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <Field label={label} required={required}>
      <input type="number" step="any" min="0" placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </Field>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-semibold text-gray-800 text-sm border-l-2 border-[#A8881C] pl-3 mb-4">{children}</h3>
  );
}

function CheckGroup({ label, options, selected, onChange }: {
  label: string; options: readonly (readonly [string, string])[];
  selected: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <label key={v} className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={selected.includes(v)} onChange={() => toggle(v)}
              className="h-4 w-4 rounded accent-[#A8881C]" />
            <span className="text-sm text-gray-700">{l}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Sección: Identificación ──────────────────────────────────────────────────

function SecIdentificacion({ d, set }: { d: CampoFormData; set: (k: keyof CampoFormData, v: unknown) => void }) {
  const [slugManual, setSlugManual] = useState(!!d.slug);

  const onTitulo = (v: string) => {
    set("titulo", v);
    if (!slugManual) set("slug", slugify(`${v} ${d.referenciaInterna}`));
  };
  const onRef = (v: string) => {
    set("referenciaInterna", v);
    if (!slugManual) set("slug", slugify(`${d.titulo} ${v}`));
  };

  return (
    <div className="space-y-4">
      <SectionTitle>Identificación</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Referencia interna" required>
          <input type="text" placeholder="CA-0001" value={d.referenciaInterna}
            onChange={(e) => onRef(e.target.value)} className={inputCls} />
        </Field>
        <SelectField label="Departamento" required value={d.departamento}
          onChange={(v) => set("departamento", v)}
          options={[["","— Seleccioná —"], ...DEPARTAMENTOS]} />
      </div>
      <Field label="Título del anuncio" required>
        <input type="text" placeholder="Campo ganadero sobre Ruta 5" value={d.titulo}
          onChange={(e) => onTitulo(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Slug (URL)">
        <input type="text" placeholder="auto-generado" value={d.slug}
          onChange={(e) => { setSlugManual(true); set("slug", slugify(e.target.value)); }}
          className={inputCls} />
        <p className="text-[11px] text-gray-400 mt-1">Se auto-genera si lo dejás vacío</p>
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Paraje">
          <input type="text" placeholder="Paso de los Toros" value={d.paraje}
            onChange={(e) => set("paraje", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Sección judicial">
          <input type="text" value={d.seccionJudicial}
            onChange={(e) => set("seccionJudicial", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Sección policial">
          <input type="text" value={d.seccionPolicial}
            onChange={(e) => set("seccionPolicial", e.target.value)} className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

// ─── Sección: Comercial ───────────────────────────────────────────────────────

function SecComercial({ d, set }: { d: CampoFormData; set: (k: keyof CampoFormData, v: unknown) => void }) {
  const tieneVenta = d.tipoOperacion.includes("venta");
  const tieneArrendamiento = d.tipoOperacion.includes("arrendamiento");
  const tienePastoreo = d.tipoOperacion.includes("pastoreo");

  return (
    <div className="space-y-4">
      <SectionTitle>Comercial</SectionTitle>
      <CheckGroup label="Tipo de operación *" options={TIPOS_OPERACION}
        selected={d.tipoOperacion}
        onChange={(v) => set("tipoOperacion", v)} />

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={d.esExclusiva}
          onChange={(e) => set("esExclusiva", e.target.checked)}
          className="h-4 w-4 accent-[#A8881C]" />
        <span className="text-sm text-gray-700">Exclusiva</span>
      </label>

      {tieneVenta && (
        <div className="grid grid-cols-2 gap-4 pt-1">
          <NumField label="Precio de venta (USD)" value={d.precioVentaUsd}
            onChange={(v) => set("precioVentaUsd", v)} placeholder="1.440.000" />
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={d.precioAConsultar}
                onChange={(e) => set("precioAConsultar", e.target.checked)}
                className="h-4 w-4 accent-[#A8881C]" />
              <span className="text-sm text-gray-700">Precio a consultar</span>
            </label>
          </div>
        </div>
      )}

      {tieneArrendamiento && (
        <NumField label="Renta de arrendamiento (USD/ha/año)" value={d.rentaArrendamientoUsdHaAnio}
          onChange={(v) => set("rentaArrendamientoUsdHaAnio", v)} placeholder="180" />
      )}

      {tienePastoreo && (
        <div className="grid grid-cols-2 gap-4">
          <NumField label="Precio de pastoreo" value={d.precioPastoreo}
            onChange={(v) => set("precioPastoreo", v)} placeholder="0" />
          <Field label="Unidad de pastoreo">
            <input type="text" placeholder="UG/mes" value={d.unidadPastoreo}
              onChange={(e) => set("unidadPastoreo", e.target.value)} className={inputCls} />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Estado de ocupación" value={d.estadoOcupacion}
          onChange={(v) => set("estadoOcupacion", v)} options={OCUPACION_OPS} />
        <Field label="Vencimiento de contrato">
          <input type="date" value={d.fechaVencimientoContrato}
            onChange={(e) => set("fechaVencimientoContrato", e.target.value)} className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

// ─── Sección: Suelo ───────────────────────────────────────────────────────────

function SecSuelo({ d, set }: { d: CampoFormData; set: (k: keyof CampoFormData, v: unknown) => void }) {
  const addConeat = () =>
    set("desgloseConeat", [...d.desgloseConeat, { grupoSuelo: "", indice: "", hectareas: "" }]);
  const removeConeat = (i: number) =>
    set("desgloseConeat", d.desgloseConeat.filter((_, idx) => idx !== i));
  const updateConeat = (i: number, field: keyof ConeatRow, v: string) =>
    set("desgloseConeat", d.desgloseConeat.map((r, idx) => idx === i ? { ...r, [field]: v } : r));

  // Calcular CONEAT promedio en tiempo real
  const coneatCalc = (() => {
    const valid = d.desgloseConeat.filter((r) => r.grupoSuelo && r.indice && r.hectareas);
    if (!valid.length) return null;
    const totalHa = valid.reduce((s, r) => s + parseFloat(r.hectareas || "0"), 0);
    if (!totalHa) return null;
    const w = valid.reduce((s, r) => s + parseFloat(r.indice || "0") * parseFloat(r.hectareas || "0"), 0);
    return (w / totalHa).toFixed(1);
  })();

  return (
    <div className="space-y-4">
      <SectionTitle>Superficie y Suelo</SectionTitle>
      <div className="grid grid-cols-3 gap-4">
        <NumField label="Superficie total (ha) *" value={d.superficieHa}
          onChange={(v) => set("superficieHa", v)} placeholder="450" required />
        <NumField label="Dotación histórica (UG/ha)" value={d.dotacionHistoricaUgHa}
          onChange={(v) => set("dotacionHistoricaUgHa", v)} placeholder="0.80" />
        <NumField label="% Prioridad forestal" value={d.pctPrioridadForestal}
          onChange={(v) => set("pctPrioridadForestal", v)} placeholder="0" />
      </div>

      <CheckGroup label="Aptitud" options={APTITUDES}
        selected={d.aptitud} onChange={(v) => set("aptitud", v)} />

      <div>
        <p className={labelCls}>Uso del suelo (ha)</p>
        <div className="grid grid-cols-3 gap-3">
          {([
            ["haLaborable", "Laborable"],
            ["haCampoNatural", "Campo natural"],
            ["haPraderas", "Praderas"],
            ["haMonteNativo", "Monte nativo"],
            ["haForestado", "Forestado"],
          ] as const).map(([k, l]) => (
            <div key={k}>
              <p className="text-[11px] text-gray-500 mb-1">{l}</p>
              <input type="number" step="any" min="0" placeholder="0"
                value={d[k] as string} onChange={(e) => set(k, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      {/* Desglose CONEAT */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={labelCls}>Desglose CONEAT
            {coneatCalc && (
              <span className="ml-2 text-[#2D4A1E] font-mono font-semibold">
                → promedio {coneatCalc}
              </span>
            )}
          </p>
          <button type="button" onClick={addConeat}
            className="text-xs text-[#A8881C] hover:text-[#8A6E14] font-medium">
            + Agregar grupo
          </button>
        </div>
        {d.desgloseConeat.length === 0 && (
          <p className="text-xs text-gray-400 italic">Sin grupos cargados aún</p>
        )}
        <div className="space-y-2">
          {d.desgloseConeat.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center">
              <input type="text" placeholder="Grupo de suelo (ej: 3.10)" value={row.grupoSuelo}
                onChange={(e) => updateConeat(i, "grupoSuelo", e.target.value)} className={inputCls} />
              <input type="number" step="any" min="0" placeholder="Índice" value={row.indice}
                onChange={(e) => updateConeat(i, "indice", e.target.value)} className={inputCls} />
              <input type="number" step="any" min="0" placeholder="Ha" value={row.hectareas}
                onChange={(e) => updateConeat(i, "hectareas", e.target.value)} className={inputCls} />
              <button type="button" onClick={() => removeConeat(i)}
                className="text-gray-400 hover:text-red-500 text-sm transition-colors">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Padrones */}
      <PadronesSection d={d} set={set} />
    </div>
  );
}

function PadronesSection({ d, set }: { d: CampoFormData; set: (k: keyof CampoFormData, v: unknown) => void }) {
  const add = () => set("padrones", [...d.padrones, { numeroPadron: "", departamento: "", superficieHa: "" }]);
  const remove = (i: number) => set("padrones", d.padrones.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof PadronRow, v: string) =>
    set("padrones", d.padrones.map((r, idx) => idx === i ? { ...r, [field]: v } : r));
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className={labelCls}>Padrones catastrales</p>
        <button type="button" onClick={add} className="text-xs text-[#A8881C] hover:text-[#8A6E14] font-medium">
          + Agregar padrón
        </button>
      </div>
      {!d.padrones.length && <p className="text-xs text-gray-400 italic">Sin padrones cargados</p>}
      <div className="space-y-2">
        {d.padrones.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-center">
            <input type="text" placeholder="Nro. padrón" value={row.numeroPadron}
              onChange={(e) => update(i, "numeroPadron", e.target.value)} className={inputCls} />
            <input type="text" placeholder="Departamento" value={row.departamento}
              onChange={(e) => update(i, "departamento", e.target.value)} className={inputCls} />
            <input type="number" step="any" min="0" placeholder="Ha" value={row.superficieHa}
              onChange={(e) => update(i, "superficieHa", e.target.value)} className={inputCls} />
            <button type="button" onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-500 text-sm transition-colors">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sección: Infraestructura ─────────────────────────────────────────────────

function SecInfraestructura({ d, set }: { d: CampoFormData; set: (k: keyof CampoFormData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <SectionTitle>Accesos e Infraestructura</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Energía eléctrica" value={d.energia}
          onChange={(v) => set("energia", v)} options={ENERGIA_OPS} />
        <SelectField label="Tipo de acceso" value={d.acceso}
          onChange={(v) => set("acceso", v)} options={ACCESO_OPS} />
      </div>
      <div className="flex items-center gap-4">
        {(["Sí","No","No relevado"] as const).map((label, idx) => {
          const val = idx === 0 ? true : idx === 1 ? false : null;
          return (
            <label key={label} className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="accesoTodoTiempo"
                checked={d.accesoTodoTiempo === val}
                onChange={() => set("accesoTodoTiempo", val)}
                className="accent-[#A8881C]" />
              <span className="text-sm text-gray-700">Acceso todo tiempo: {label}</span>
            </label>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <NumField label="Km a ruta" value={d.kmARuta} onChange={(v) => set("kmARuta", v)} placeholder="5" />
        <NumField label="Km a centro poblado" value={d.kmACentroPoblado}
          onChange={(v) => set("kmACentroPoblado", v)} placeholder="12" />
        <Field label="Centro poblado de referencia">
          <input type="text" placeholder="Paso de los Toros" value={d.centroPobladoReferencia}
            onChange={(e) => set("centroPobladoReferencia", e.target.value)} className={inputCls} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <NumField label="Cantidad de potreros" value={d.cantidadPotreros}
          onChange={(v) => set("cantidadPotreros", v)} placeholder="8" />
        <NumField label="Km de alambrado" value={d.kmAlambrado}
          onChange={(v) => set("kmAlambrado", v)} placeholder="24" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Alambrado perimetral" value={d.alambradoPerimetralEstado}
          onChange={(v) => set("alambradoPerimetralEstado", v)} options={ESTADO_MEJORA_OPS} />
        <SelectField label="Alambrado divisorio" value={d.alambradoDivisorioEstado}
          onChange={(v) => set("alambradoDivisorioEstado", v)} options={ESTADO_MEJORA_OPS} />
      </div>
    </div>
  );
}

// ─── Sección: Agua ────────────────────────────────────────────────────────────

function SecAgua({ d, set }: { d: CampoFormData; set: (k: keyof CampoFormData, v: unknown) => void }) {
  const add = () => set("fuentesAgua", [...d.fuentesAgua, { tipo: "", cantidad: "1", estado: "", observaciones: "" }]);
  const remove = (i: number) => set("fuentesAgua", d.fuentesAgua.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof FuenteRow, v: string) =>
    set("fuentesAgua", d.fuentesAgua.map((r, idx) => idx === i ? { ...r, [field]: v } : r));

  return (
    <div className="space-y-4">
      <SectionTitle>Agua</SectionTitle>
      <div className="flex items-center justify-between">
        <p className={labelCls}>Fuentes de agua</p>
        <button type="button" onClick={add} className="text-xs text-[#A8881C] hover:text-[#8A6E14] font-medium">
          + Agregar fuente
        </button>
      </div>
      {!d.fuentesAgua.length && <p className="text-xs text-gray-400 italic">Sin fuentes cargadas</p>}
      <div className="space-y-3">
        {d.fuentesAgua.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_60px_120px_1fr_32px] gap-2 items-start">
            <div className="relative">
              <select value={row.tipo} onChange={(e) => update(i, "tipo", e.target.value)} className={selectCls}>
                <option value="">— Tipo —</option>
                {FUENTE_AGUA_TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
            </div>
            <input type="number" min="1" placeholder="Cant." value={row.cantidad}
              onChange={(e) => update(i, "cantidad", e.target.value)} className={inputCls} />
            <div className="relative">
              <select value={row.estado} onChange={(e) => update(i, "estado", e.target.value)} className={selectCls}>
                {ESTADO_MEJORA_OPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
            </div>
            <input type="text" placeholder="Observaciones" value={row.observaciones}
              onChange={(e) => update(i, "observaciones", e.target.value)} className={inputCls} />
            <button type="button" onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-500 text-sm mt-2 transition-colors">✕</button>
          </div>
        ))}
      </div>

      <div className="pt-2 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={d.tieneDerechoRiego}
            onChange={(e) => set("tieneDerechoRiego", e.target.checked)}
            className="h-4 w-4 accent-[#A8881C]" />
          <span className="text-sm text-gray-700">Tiene derecho de riego (DINAGUA)</span>
        </label>
        {d.tieneDerechoRiego && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Padrón con permiso de riego">
              <input type="text" value={d.padronConPermisoRiego}
                onChange={(e) => set("padronConPermisoRiego", e.target.value)} className={inputCls} />
            </Field>
            <NumField label="Ha bajo riego" value={d.haBajoRiego}
              onChange={(v) => set("haBajoRiego", v)} placeholder="50" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sección: Mejoras ─────────────────────────────────────────────────────────

function SecMejoras({ d, set }: { d: CampoFormData; set: (k: keyof CampoFormData, v: unknown) => void }) {
  const add = () => set("mejoras", [...d.mejoras, { tipo: "", superficieM2: "", estado: "", descripcion: "", antiguedadAnios: "" }]);
  const remove = (i: number) => set("mejoras", d.mejoras.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof MejoraRow, v: string) =>
    set("mejoras", d.mejoras.map((r, idx) => idx === i ? { ...r, [field]: v } : r));

  return (
    <div className="space-y-4">
      <SectionTitle>Mejoras e Infraestructura</SectionTitle>
      <div className="flex items-center justify-between">
        <p className={labelCls}>Lista de mejoras</p>
        <button type="button" onClick={add} className="text-xs text-[#A8881C] hover:text-[#8A6E14] font-medium">
          + Agregar mejora
        </button>
      </div>
      {!d.mejoras.length && <p className="text-xs text-gray-400 italic">Sin mejoras cargadas</p>}
      <div className="space-y-3">
        {d.mejoras.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_80px_1fr_64px_32px] gap-2 items-start">
            <div className="relative">
              <select value={row.tipo} onChange={(e) => update(i, "tipo", e.target.value)} className={selectCls}>
                <option value="">— Tipo —</option>
                {MEJORA_TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
            </div>
            <input type="number" step="any" min="0" placeholder="m²" value={row.superficieM2}
              onChange={(e) => update(i, "superficieM2", e.target.value)} className={inputCls} />
            <div className="relative">
              <select value={row.estado} onChange={(e) => update(i, "estado", e.target.value)} className={selectCls}>
                {ESTADO_MEJORA_OPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
            </div>
            <input type="text" placeholder="Descripción" value={row.descripcion}
              onChange={(e) => update(i, "descripcion", e.target.value)} className={inputCls} />
            <input type="number" min="0" placeholder="Años" value={row.antiguedadAnios}
              onChange={(e) => update(i, "antiguedadAnios", e.target.value)} className={inputCls} />
            <button type="button" onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-500 text-sm mt-2 transition-colors">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sección: Publicación ─────────────────────────────────────────────────────

function SecPublicacion({ d, set }: { d: CampoFormData; set: (k: keyof CampoFormData, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <SectionTitle>Ubicación y Publicación</SectionTitle>
      <SelectField label="Precisión de ubicación" value={d.precisionUbicacion}
        onChange={(v) => set("precisionUbicacion", v)} options={PRECISION_OPS} />
      {d.precisionUbicacion === "aproximada" && (
        <NumField label="Radio de aproximación (metros)" value={d.radioAproximacionM}
          onChange={(v) => set("radioAproximacionM", v)} placeholder="2000" />
      )}
      <SelectField label="Estado de publicación" value={d.estadoPublicacion}
        onChange={(v) => set("estadoPublicacion", v)} options={ESTADO_PUB_OPS} />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={d.destacado}
          onChange={(e) => set("destacado", e.target.checked)}
          className="h-4 w-4 accent-[#A8881C]" />
        <span className="text-sm text-gray-700">Destacado en el inicio</span>
      </label>
      <Field label="Estado dominial">
        <textarea rows={2} value={d.estadoDominial}
          onChange={(e) => set("estadoDominial", e.target.value)}
          className={`${inputCls} resize-none`} placeholder="Libre de gravámenes, etc." />
      </Field>
      <Field label="Observaciones jurídicas">
        <textarea rows={2} value={d.observacionesJuridicas}
          onChange={(e) => set("observacionesJuridicas", e.target.value)}
          className={`${inputCls} resize-none`} />
      </Field>
      <Field label="Notas internas">
        <textarea rows={3} value={d.notasInternas}
          onChange={(e) => set("notasInternas", e.target.value)}
          className={`${inputCls} resize-none`} placeholder="Visible solo para el equipo" />
      </Field>
    </div>
  );
}

// ─── Form principal ───────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "identificacion", label: "Identificación" },
  { id: "comercial", label: "Comercial" },
  { id: "suelo", label: "Suelo" },
  { id: "infraestructura", label: "Infraestructura" },
  { id: "agua", label: "Agua" },
  { id: "mejoras", label: "Mejoras" },
  { id: "publicacion", label: "Publicación" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

type Props = {
  campoId?: string;
  initialData?: Partial<CampoFormData>;
};

export default function CampoForm({ campoId, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [section, setSection] = useState<SectionId>("identificacion");
  const [error, setError] = useState<string | null>(null);
  const [d, setD] = useState<CampoFormData>({ ...INITIAL, ...initialData });

  const set = (k: keyof CampoFormData, v: unknown) =>
    setD((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = campoId
        ? await actualizarCampo(campoId, d)
        : await crearCampo(d);
      if (result && "error" in result) setError(result.error);
    });
  }

  const sectionContent: Record<SectionId, React.ReactNode> = {
    identificacion: <SecIdentificacion d={d} set={set} />,
    comercial: <SecComercial d={d} set={set} />,
    suelo: <SecSuelo d={d} set={set} />,
    infraestructura: <SecInfraestructura d={d} set={set} />,
    agua: <SecAgua d={d} set={set} />,
    mejoras: <SecMejoras d={d} set={set} />,
    publicacion: <SecPublicacion d={d} set={set} />,
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-6 items-start">
      {/* Sidebar de secciones */}
      <nav className="w-44 shrink-0 sticky top-6">
        <ul className="space-y-0.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  section === s.id
                    ? "bg-[#2D4A1E] text-white font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Resumen del estado */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-500 space-y-1">
          <p><span className="font-mono font-semibold text-gray-700">{d.referenciaInterna || "—"}</span></p>
          <p>{d.superficieHa ? `${d.superficieHa} ha` : "— ha"}</p>
          <p className={d.estadoPublicacion === "publicado" ? "text-green-600 font-semibold" : ""}>
            {d.estadoPublicacion || "borrador"}
          </p>
        </div>
      </nav>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
          {sectionContent[section]}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Navegación entre secciones y guardar */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {SECTIONS.findIndex((s) => s.id === section) > 0 && (
              <button type="button"
                onClick={() => {
                  const idx = SECTIONS.findIndex((s) => s.id === section);
                  setSection(SECTIONS[idx - 1].id);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Anterior
              </button>
            )}
            {SECTIONS.findIndex((s) => s.id === section) < SECTIONS.length - 1 && (
              <button type="button"
                onClick={() => {
                  const idx = SECTIONS.findIndex((s) => s.id === section);
                  setSection(SECTIONS[idx + 1].id);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Siguiente →
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => router.push("/admin/campos")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="rounded-lg bg-[#2D4A1E] px-6 py-2 text-sm font-semibold text-white hover:bg-[#3a5e27] disabled:opacity-50 transition-colors">
              {isPending ? "Guardando..." : campoId ? "Guardar cambios" : "Crear campo"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
