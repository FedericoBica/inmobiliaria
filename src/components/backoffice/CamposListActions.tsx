"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { cambiarEstado, eliminarCampo } from "@/app/(backoffice)/admin/(dashboard)/campos/actions";

const ESTADO_BADGE: Record<string, string> = {
  borrador:   "bg-gray-100 text-gray-600",
  publicado:  "bg-green-100 text-green-700",
  reservado:  "bg-blue-100 text-blue-700",
  vendido:    "bg-purple-100 text-purple-700",
  off_market: "bg-amber-100 text-amber-700",
};

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador", publicado: "Publicado", reservado: "Reservado",
  vendido: "Vendido", off_market: "Off-market",
};

export function EstadoSelect({ id, estado }: { id: string; estado: string }) {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState(estado);

  return (
    <div className="relative inline-block">
      <select
        value={current}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value;
          setCurrent(next);
          startTransition(() => cambiarEstado(id, next));
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

export function DeleteButton({ id, referencia }: { id: string; referencia: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <button
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await eliminarCampo(id);
              router.refresh();
            });
          }}
          className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
        >
          {isPending ? "..." : "Confirmar"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:text-gray-600">
          No
        </button>
      </span>
    );
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="text-xs text-red-400 hover:text-red-600 transition-colors">
      Eliminar
    </button>
  );
}
