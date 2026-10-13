"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ContenidoFormData } from "@/app/(backoffice)/admin/(dashboard)/contenido/actions";
import {
  crearContenido,
  actualizarContenido,
  subirImagenDestacada,
} from "@/app/(backoffice)/admin/(dashboard)/contenido/actions";
import { slugify } from "@/lib/slugify";

const TIPOS = [
  ["informe_mercado", "Informe de mercado"],
  ["articulo", "Artículo"],
  ["guia", "Guía"],
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

export default function ContenidoForm({
  contenidoId,
  initialData,
}: {
  contenidoId?: string;
  initialData?: Partial<ContenidoFormData>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [d, setD] = useState<ContenidoFormData>({
    tipo: initialData?.tipo ?? "articulo",
    titulo: initialData?.titulo ?? "",
    slug: initialData?.slug ?? "",
    extracto: initialData?.extracto ?? "",
    cuerpo: initialData?.cuerpo ?? "",
    imagenDestacada: initialData?.imagenDestacada ?? "",
    publicado: initialData?.publicado ?? false,
  });

  function set<K extends keyof ContenidoFormData>(key: K, value: ContenidoFormData[K]) {
    setD((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImagenChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.set("file", file);
    const result = await subirImagenDestacada(formData);

    setIsUploading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    set("imagenDestacada", result.url);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = contenidoId ? await actualizarContenido(contenidoId, d) : await crearContenido(d);
      if (result && "error" in result) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo" required>
          <div className="relative">
            <select value={d.tipo} onChange={(e) => set("tipo", e.target.value)} className={selectCls}>
              {TIPOS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
          </div>
        </Field>

        <Field label="Publicación">
          <label className="flex items-center gap-2 cursor-pointer mt-2.5">
            <input
              type="checkbox"
              checked={d.publicado}
              onChange={(e) => set("publicado", e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Publicado</span>
          </label>
        </Field>
      </div>

      <Field label="Título" required>
        <input
          type="text"
          value={d.titulo}
          onChange={(e) => {
            set("titulo", e.target.value);
            if (!contenidoId && !d.slug) set("slug", slugify(e.target.value));
          }}
          className={inputCls}
          required
        />
      </Field>

      <Field label="Slug">
        <input
          type="text"
          value={d.slug}
          onChange={(e) => set("slug", e.target.value)}
          placeholder="auto-generado del título"
          className={inputCls}
        />
      </Field>

      <Field label="Extracto">
        <textarea
          value={d.extracto}
          onChange={(e) => set("extracto", e.target.value)}
          rows={2}
          placeholder="Resumen corto para el listado"
          className={inputCls}
        />
      </Field>

      <Field label="Imagen destacada">
        <div className="flex items-center gap-3">
          {d.imagenDestacada && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={d.imagenDestacada}
              alt=""
              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            />
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImagenChange}
              disabled={isUploading}
              className="text-xs text-gray-500"
            />
            {isUploading && <p className="text-xs text-gray-400 mt-1">Subiendo...</p>}
          </div>
        </div>
      </Field>

      <Field label="Cuerpo" required>
        <textarea
          value={d.cuerpo}
          onChange={(e) => set("cuerpo", e.target.value)}
          rows={14}
          className={`${inputCls} font-mono text-xs`}
          required
        />
      </Field>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || isUploading}
          className="rounded-xl bg-[#2D4A1E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3a5e27] disabled:opacity-60 transition-colors"
        >
          {isPending ? "Guardando..." : contenidoId ? "Guardar cambios" : "Crear contenido"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/contenido")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
