"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { cambiarEstadoConsulta, actualizarNotasConsulta } from "@/app/(backoffice)/admin/(dashboard)/leads/actions";

const ESTADO_BADGE: Record<string, string> = {
  nueva: "bg-blue-100 text-blue-700",
  contactado: "bg-amber-100 text-amber-700",
  en_negociacion: "bg-purple-100 text-purple-700",
  cerrado_ganado: "bg-green-100 text-green-700",
  cerrado_perdido: "bg-gray-100 text-gray-500",
  descartado: "bg-gray-100 text-gray-400",
};

const ESTADO_LABEL: Record<string, string> = {
  nueva: "Nueva",
  contactado: "Contactado",
  en_negociacion: "En negociación",
  cerrado_ganado: "Cerrado (ganado)",
  cerrado_perdido: "Cerrado (perdido)",
  descartado: "Descartado",
};

export function EstadoConsultaSelect({
  id,
  estado,
  readOnly,
}: {
  id: string;
  estado: string;
  readOnly?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState(estado);
  const router = useRouter();

  if (readOnly) {
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${ESTADO_BADGE[current] ?? "bg-gray-100 text-gray-600"}`}>
        {ESTADO_LABEL[current] ?? current}
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <select
        value={current}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value;
          setCurrent(next);
          startTransition(async () => {
            await cambiarEstadoConsulta(id, next);
            router.refresh();
          });
        }}
        className={`pr-6 pl-2 py-1 rounded-full text-xs font-semibold border-0 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A8881C] disabled:opacity-60 ${ESTADO_BADGE[current] ?? "bg-gray-100 text-gray-600"}`}
      >
        {Object.entries(ESTADO_LABEL).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-current opacity-60 text-[10px]">▾</span>
    </div>
  );
}

export function NotasConsulta({
  id,
  notas,
  readOnly,
}: {
  id: string;
  notas: string;
  readOnly?: boolean;
}) {
  const [value, setValue] = useState(notas);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div>
      <textarea
        value={value}
        disabled={readOnly || isPending}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        onBlur={() => {
          if (value === notas) return;
          startTransition(async () => {
            await actualizarNotasConsulta(id, value);
            setSaved(true);
          });
        }}
        rows={2}
        placeholder={readOnly ? "—" : "Nota interna..."}
        className="w-full text-xs rounded-md border border-gray-200 px-2 py-1.5 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#A8881C] disabled:bg-gray-50 disabled:text-gray-400"
      />
      {isPending && <p className="text-[10px] text-gray-400 mt-0.5">Guardando...</p>}
      {saved && !isPending && <p className="text-[10px] text-campo mt-0.5">Guardado</p>}
    </div>
  );
}
