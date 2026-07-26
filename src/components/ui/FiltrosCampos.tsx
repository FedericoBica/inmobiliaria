"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const DEPARTAMENTOS = [
  "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno",
  "Flores", "Florida", "Lavalleja", "Maldonado", "Montevideo",
  "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto",
  "San José", "Soriano", "Tacuarembó", "Treinta y Tres",
];

const TIPOS = [
  { value: "venta", label: "Compra" },
  { value: "arrendamiento", label: "Arrendamiento" },
  { value: "pastoreo", label: "Pastoreo" },
  { value: "permuta", label: "Permuta" },
];

const APTITUDES = [
  { value: "agricola", label: "Agrícola" },
  { value: "ganadera", label: "Ganadera" },
  { value: "agricola_ganadera", label: "Agrícola-Ganadera" },
  { value: "lechera", label: "Lechera" },
  { value: "forestal", label: "Forestal" },
  { value: "mixta", label: "Mixta" },
];

const CONEAT_OPCIONES = [
  { value: "", label: "Cualquier índice" },
  { value: "60", label: "≥ 60 (mínimo)" },
  { value: "80", label: "≥ 80 (bueno)" },
  { value: "100", label: "≥ 100 (muy bueno)" },
  { value: "120", label: "≥ 120 (excelente)" },
];

function normalizeDept(d: string) {
  return d.toLowerCase()
    .replace(/\s/g, "_")
    .replace(/á/g, "a").replace(/é/g, "e")
    .replace(/í/g, "i").replace(/ó/g, "o")
    .replace(/ú/g, "u");
}

export default function FiltrosCampos({ onApply }: { onApply?: () => void } = {}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [departamento, setDepartamento] = useState(sp.get("departamento") ?? "");
  const [tipo, setTipo] = useState(sp.get("tipo") ?? "");
  const [haMin, setHaMin] = useState(sp.get("ha_min") ?? "");
  const [haMax, setHaMax] = useState(sp.get("ha_max") ?? "");
  const [precioMax, setPrecioMax] = useState(sp.get("precio_max") ?? "");
  const [coneatMin, setConeatMin] = useState(sp.get("coneat_min") ?? "");
  const [aptitudes, setAptitudes] = useState<string[]>(
    sp.get("aptitud") ? sp.get("aptitud")!.split(",") : []
  );

  const toggleAptitud = (v: string) =>
    setAptitudes((prev) =>
      prev.includes(v) ? prev.filter((a) => a !== v) : [...prev, v]
    );

  const apply = useCallback(() => {
    const p = new URLSearchParams();
    if (departamento) p.set("departamento", departamento);
    if (tipo)         p.set("tipo", tipo);
    if (haMin)        p.set("ha_min", haMin);
    if (haMax)        p.set("ha_max", haMax);
    if (precioMax)    p.set("precio_max", precioMax);
    if (coneatMin)    p.set("coneat_min", coneatMin);
    if (aptitudes.length) p.set("aptitud", aptitudes.join(","));
    router.push(`/campos?${p.toString()}`);
    onApply?.();
  }, [router, departamento, tipo, haMin, haMax, precioMax, coneatMin, aptitudes, onApply]);

  const reset = () => {
    setDepartamento(""); setTipo(""); setHaMin(""); setHaMax("");
    setPrecioMax(""); setConeatMin(""); setAptitudes([]);
    router.push("/campos");
    onApply?.();
  };

  const hasFilters = !!(departamento || tipo || haMin || haMax || precioMax || coneatMin || aptitudes.length);

  const labelCls = "block text-[11px] font-mono uppercase tracking-wider text-piedra mb-1.5";
  const selectCls = "w-full rounded-lg border border-crema bg-white px-3 py-2 text-sm text-tierra focus:outline-none focus:ring-2 focus:ring-trigal appearance-none cursor-pointer";
  const inputCls  = "w-full rounded-lg border border-crema bg-white px-3 py-2 text-sm text-tierra placeholder-piedra focus:outline-none focus:ring-2 focus:ring-trigal";

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-5">
        <p className="font-display text-lg font-semibold text-tierra">Filtros</p>
        {hasFilters && (
          <button onClick={reset} className="text-xs text-piedra hover:text-trigal transition-colors underline">
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Departamento */}
        <div>
          <label className={labelCls}>Departamento</label>
          <div className="relative">
            <select value={departamento} onChange={(e) => setDepartamento(e.target.value)} className={selectCls}>
              <option value="">Todos</option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={normalizeDept(d)}>{d}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-piedra text-xs">▾</span>
          </div>
        </div>

        {/* Tipo de operación */}
        <div>
          <label className={labelCls}>Tipo de operación</label>
          <div className="relative">
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={selectCls}>
              <option value="">Todos</option>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-piedra text-xs">▾</span>
          </div>
        </div>

        {/* Hectáreas */}
        <div>
          <label className={labelCls}>Superficie (ha)</label>
          <div className="flex gap-2">
            <input
              type="number" min="0" placeholder="Desde"
              value={haMin} onChange={(e) => setHaMin(e.target.value)}
              className={inputCls}
            />
            <input
              type="number" min="0" placeholder="Hasta"
              value={haMax} onChange={(e) => setHaMax(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Precio máximo USD/ha */}
        <div>
          <label className={labelCls}>Precio máx. (USD/ha)</label>
          <input
            type="number" min="0" placeholder="Ej: 5000"
            value={precioMax} onChange={(e) => setPrecioMax(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* CONEAT mínimo */}
        <div>
          <label className={labelCls}>Índice CONEAT mín.</label>
          <div className="relative">
            <select value={coneatMin} onChange={(e) => setConeatMin(e.target.value)} className={selectCls}>
              {CONEAT_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-piedra text-xs">▾</span>
          </div>
        </div>

        {/* Aptitud */}
        <div>
          <label className={labelCls}>Aptitud</label>
          <div className="space-y-1.5">
            {APTITUDES.map((a) => (
              <label key={a.value} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={aptitudes.includes(a.value)}
                  onChange={() => toggleAptitud(a.value)}
                  className="h-4 w-4 rounded accent-trigal shrink-0"
                />
                <span className="text-sm text-tierra group-hover:text-trigal transition-colors">{a.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Aplicar */}
        <button
          onClick={apply}
          className="w-full rounded-xl bg-trigal py-2.5 text-sm font-semibold text-white hover:bg-[#8A6E14] transition-colors"
        >
          Aplicar filtros
        </button>
      </div>
    </aside>
  );
}
