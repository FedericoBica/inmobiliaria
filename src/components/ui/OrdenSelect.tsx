"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_LABEL: Record<string, string> = {
  reciente:    "Más recientes",
  ha_desc:     "Mayor superficie",
  ha_asc:      "Menor superficie",
  precio_asc:  "Menor precio",
  precio_desc: "Mayor precio",
  coneat_desc: "Mayor CONEAT",
};

export default function OrdenSelect({ orden }: { orden: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(sp.toString());
    params.set("orden", e.target.value);
    router.push(`/campos?${params.toString()}`);
  }

  return (
    <div className="relative shrink-0">
      <select
        value={orden}
        onChange={handleChange}
        className="h-9 rounded-lg border border-crema bg-white pl-3 pr-8 text-sm text-tierra focus:outline-none focus:ring-2 focus:ring-trigal appearance-none cursor-pointer"
      >
        {Object.entries(SORT_LABEL).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-piedra text-xs">▾</span>
    </div>
  );
}
