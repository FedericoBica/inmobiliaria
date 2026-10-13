"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { eliminarContenido } from "@/app/(backoffice)/admin/(dashboard)/contenido/actions";

export function DeleteContenidoButton({ id }: { id: string }) {
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
              await eliminarContenido(id);
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
    <button onClick={() => setConfirming(true)} className="text-xs text-red-400 hover:text-red-600 transition-colors">
      Eliminar
    </button>
  );
}
