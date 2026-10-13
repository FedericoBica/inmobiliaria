"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AgenteFormData } from "@/app/(backoffice)/admin/(dashboard)/agentes/actions";
import { crearAgente, actualizarAgente } from "@/app/(backoffice)/admin/(dashboard)/agentes/actions";

const ROLES = [
  ["agente", "Agente"],
  ["gerente_comercial", "Gerente comercial"],
  ["editor_contenido", "Editor de contenido"],
  ["solo_lectura", "Solo lectura"],
  ["administrador", "Administrador"],
] as const;

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8881C] focus:border-[#A8881C]";
const selectCls = `${inputCls} appearance-none cursor-pointer`;
const labelCls = "block text-xs font-medium text-gray-600 mb-1";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function AgenteForm({
  agenteId,
  initialData,
  bloquearRolPropio,
}: {
  agenteId?: string;
  initialData?: Partial<AgenteFormData>;
  bloquearRolPropio?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [d, setD] = useState<AgenteFormData>({
    nombre: initialData?.nombre ?? "",
    apellido: initialData?.apellido ?? "",
    email: initialData?.email ?? "",
    telefono: initialData?.telefono ?? "",
    rol: initialData?.rol ?? "agente",
    password: "",
  });

  function set<K extends keyof AgenteFormData>(key: K, value: AgenteFormData[K]) {
    setD((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = agenteId
        ? await actualizarAgente(agenteId, {
            nombre: d.nombre,
            apellido: d.apellido,
            email: d.email,
            telefono: d.telefono,
            rol: d.rol,
          })
        : await crearAgente(d);

      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre" required>
          <input
            type="text"
            value={d.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            className={inputCls}
            required
          />
        </Field>
        <Field label="Apellido" required>
          <input
            type="text"
            value={d.apellido}
            onChange={(e) => set("apellido", e.target.value)}
            className={inputCls}
            required
          />
        </Field>
      </div>

      <Field label="Email" required>
        <input
          type="email"
          value={d.email}
          onChange={(e) => set("email", e.target.value)}
          className={inputCls}
          required
        />
      </Field>

      <Field label="Teléfono">
        <input
          type="tel"
          value={d.telefono}
          onChange={(e) => set("telefono", e.target.value)}
          className={inputCls}
          placeholder="+598..."
        />
      </Field>

      <Field label="Rol" required>
        <div className="relative">
          <select
            value={d.rol}
            onChange={(e) => set("rol", e.target.value)}
            className={selectCls}
            disabled={bloquearRolPropio}
          >
            {ROLES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            ▾
          </span>
        </div>
        {bloquearRolPropio && (
          <p className="text-xs text-gray-400 mt-1">No podés cambiar tu propio rol de administrador.</p>
        )}
      </Field>

      {!agenteId && (
        <Field label="Contraseña temporal" required>
          <input
            type="text"
            value={d.password}
            onChange={(e) => set("password", e.target.value)}
            className={inputCls}
            placeholder="Mínimo 12 caracteres"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Comunicala al agente por un canal seguro — se recomienda cambiarla en el primer acceso.
          </p>
        </Field>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#2D4A1E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a5e27] disabled:opacity-60 transition-colors"
        >
          {isPending ? "Guardando..." : agenteId ? "Guardar cambios" : "Crear agente"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/agentes")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
