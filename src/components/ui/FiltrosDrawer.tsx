"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FiltrosCampos from "./FiltrosCampos";

export default function FiltrosDrawer() {
  const [open, setOpen] = useState(false);
  const sp = useSearchParams();

  // Count active filters for the badge
  const activeCount = [
    sp.get("departamento"),
    sp.get("tipo"),
    sp.get("ha_min") || sp.get("ha_max"),
    sp.get("precio_max"),
    sp.get("coneat_min"),
    sp.get("aptitud"),
  ].filter(Boolean).length;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-10 rounded-xl border border-crema bg-white px-4 text-sm font-semibold text-tierra hover:border-trigal transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="14" y2="12" />
          <line x1="4" y1="18" x2="10" y2="18" />
        </svg>
        Filtros
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-trigal text-white text-[11px] font-bold px-1.5">
            {activeCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "88dvh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-crema" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-crema">
          <p className="font-display text-lg font-semibold text-tierra">Filtros</p>
          <button
            onClick={() => setOpen(false)}
            className="text-piedra hover:text-tierra transition-colors p-1"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 py-5" style={{ maxHeight: "calc(88dvh - 80px)" }}>
          <FiltrosCampos onApply={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
