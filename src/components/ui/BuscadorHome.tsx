"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEPARTAMENTOS = [
  "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno",
  "Flores", "Florida", "Lavalleja", "Maldonado", "Montevideo",
  "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto",
  "San José", "Soriano", "Tacuarembó", "Treinta y Tres",
];

const TIPOS = [
  { value: "venta",        label: "Compra" },
  { value: "arrendamiento", label: "Arrendamiento" },
  { value: "pastoreo",     label: "Pastoreo" },
  { value: "permuta",      label: "Permuta" },
];

export default function BuscadorHome() {
  const router = useRouter();
  const [departamento, setDepartamento] = useState("");
  const [tipo, setTipo] = useState("");
  const [haMin, setHaMin] = useState("");
  const [haMax, setHaMax] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (departamento) p.set("departamento", departamento);
    if (tipo)         p.set("tipo", tipo);
    if (haMin)        p.set("ha_min", haMin);
    if (haMax)        p.set("ha_max", haMax);
    router.push(`/campos?${p.toString()}`);
  }

  const selectCls =
    "h-[52px] w-full rounded-lg border border-crema bg-white px-4 text-tierra text-[15px] focus:outline-none focus:ring-2 focus:ring-trigal appearance-none cursor-pointer";

  const inputCls =
    "h-[52px] w-full rounded-lg border border-crema bg-white px-4 text-tierra text-[15px] focus:outline-none focus:ring-2 focus:ring-trigal";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">

        {/* Departamento */}
        <div className="relative">
          <label className="sr-only" htmlFor="departamento">Departamento</label>
          <select
            id="departamento"
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className={selectCls}
          >
            <option value="">Todos los departamentos</option>
            {DEPARTAMENTOS.map((d) => (
              <option key={d} value={d.toLowerCase().replace(/\s/g, "_").replace(/á/g,"a").replace(/é/g,"e").replace(/í/g,"i").replace(/ó/g,"o").replace(/ú/g,"u")}>
                {d}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-piedra">▾</span>
        </div>

        {/* Tipo de operación */}
        <div className="relative">
          <label className="sr-only" htmlFor="tipo">Tipo de operación</label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={selectCls}
          >
            <option value="">Compra / Arriendo / Pastoreo</option>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-piedra">▾</span>
        </div>

        {/* Hectáreas mín */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <label className="sr-only" htmlFor="ha-min">Mínimo de hectáreas</label>
            <input
              id="ha-min"
              type="number"
              min="0"
              placeholder="Desde (ha)"
              value={haMin}
              onChange={(e) => setHaMin(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="relative flex-1">
            <label className="sr-only" htmlFor="ha-max">Máximo de hectáreas</label>
            <input
              id="ha-max"
              type="number"
              min="0"
              placeholder="Hasta (ha)"
              value={haMax}
              onChange={(e) => setHaMax(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Botón */}
        <button
          type="submit"
          className="h-[52px] rounded-lg bg-trigal px-8 text-[15px] font-semibold text-white transition-colors hover:bg-[#8A6E14] active:scale-[0.98] xl:col-start-5 cursor-pointer"
        >
          Buscar campos
        </button>
      </div>
    </form>
  );
}
