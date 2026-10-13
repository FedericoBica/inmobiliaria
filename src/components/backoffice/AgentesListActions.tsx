"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cambiarActivo,
  desbloquearAgente,
  resetearContrasena,
} from "@/app/(backoffice)/admin/(dashboard)/agentes/actions";

export function ToggleActivoButton({
  id,
  activo,
  esPropio,
}: {
  id: string;
  activo: boolean;
  esPropio: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (esPropio) return <span className="text-xs text-gray-300">—</span>;

  return (
    <div>
      <button
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await cambiarActivo(id, !activo);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Error");
            }
          });
        }}
        className={`text-xs font-medium hover:underline disabled:opacity-50 ${
          activo ? "text-red-500 hover:text-red-700" : "text-campo"
        }`}
      >
        {isPending ? "..." : activo ? "Desactivar" : "Activar"}
      </button>
      {error && <p className="text-[11px] text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

export function DesbloquearButton({ id, bloqueado }: { id: string; bloqueado: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!bloqueado) return <span className="text-xs text-gray-300">—</span>;

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await desbloquearAgente(id);
        router.refresh();
      })}
      className="text-xs font-medium text-amber-600 hover:text-amber-800 hover:underline disabled:opacity-50"
    >
      {isPending ? "..." : "Desbloquear"}
    </button>
  );
}

export function ResetPasswordButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [temporal, setTemporal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (temporal) {
    return (
      <div className="text-xs">
        <p className="text-gray-500 mb-1">Nueva contraseña (comunicala y cerrá):</p>
        <code className="bg-gray-100 rounded px-2 py-1 font-mono text-gray-800 select-all">{temporal}</code>
        <button onClick={() => setTemporal(null)} className="ml-2 text-gray-400 hover:text-gray-600">
          Listo
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await resetearContrasena(id);
            if (result && "error" in result) setError(result.error);
            else if (result && "passwordTemporal" in result && result.passwordTemporal) {
              setTemporal(result.passwordTemporal);
            }
          });
        }}
        className="text-xs text-gray-500 hover:text-gray-700 hover:underline disabled:opacity-50"
      >
        {isPending ? "..." : "Resetear contraseña"}
      </button>
      {error && <p className="text-[11px] text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}
