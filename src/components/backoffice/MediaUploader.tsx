"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  subirMedia,
  eliminarMedia,
  actualizarAltTextMedia,
  moverMedia,
} from "@/app/(backoffice)/admin/(dashboard)/campos/media-actions";

export type MediaItem = {
  id: string;
  tipo: string;
  url: string;
  urlThumb: string | null;
  altText: string | null;
  orden: number;
};

const TIPO_LABEL: Record<string, string> = {
  foto: "Foto",
  foto_drone: "Foto aérea (dron)",
};

export default function MediaUploader({
  campoId,
  initialMedia,
}: {
  campoId: string;
  initialMedia: MediaItem[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState<"foto" | "foto_drone">("foto");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const files = Array.from(fileList);
    setUploadingCount(files.length);

    startTransition(async () => {
      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("tipo", tipo);
        const result = await subirMedia(campoId, formData);
        if ("error" in result) {
          setError(result.error);
        }
      }
      setUploadingCount(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "foto" | "foto_drone")}
            className="appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-7 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A8881C]"
          >
            <option value="foto">Foto</option>
            <option value="foto_drone">Foto aérea (dron)</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
        </div>

        <label className="cursor-pointer rounded-lg bg-[#2D4A1E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a5e27] transition-colors">
          {isPending ? `Subiendo ${uploadingCount}...` : "+ Subir imágenes"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={isPending}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </label>

        <p className="text-xs text-gray-400">JPEG, PNG o WebP · máx. 15MB por archivo</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {initialMedia.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin imágenes cargadas aún</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {initialMedia.map((item, i) => (
            <MediaCard
              key={item.id}
              item={item}
              campoId={campoId}
              isFirst={i === 0}
              isLast={i === initialMedia.length - 1}
              onChanged={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaCard({
  item,
  campoId,
  isFirst,
  isLast,
  onChanged,
}: {
  item: MediaItem;
  campoId: string;
  isFirst: boolean;
  isLast: boolean;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [altText, setAltText] = useState(item.altText ?? "");
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="relative aspect-square bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.urlThumb ?? item.url}
          alt={item.altText ?? ""}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold uppercase tracking-wide bg-black/60 text-white rounded px-1.5 py-0.5">
          {TIPO_LABEL[item.tipo] ?? item.tipo}
        </span>
      </div>

      <div className="p-2.5 space-y-2">
        <input
          type="text"
          placeholder="Texto alternativo (accesibilidad)"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          onBlur={() => {
            if (altText !== (item.altText ?? "")) {
              startTransition(async () => {
                await actualizarAltTextMedia(item.id, campoId, altText);
                onChanged();
              });
            }
          }}
          className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#A8881C]"
        />

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button
              type="button"
              disabled={isFirst || isPending}
              onClick={() =>
                startTransition(async () => {
                  await moverMedia(campoId, item.id, "arriba");
                  onChanged();
                })
              }
              className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
              title="Mover arriba"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={isLast || isPending}
              onClick={() =>
                startTransition(async () => {
                  await moverMedia(campoId, item.id, "abajo");
                  onChanged();
                })
              }
              className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
              title="Mover abajo"
            >
              ↓
            </button>
          </div>

          {confirming ? (
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await eliminarMedia(item.id, campoId);
                    onChanged();
                  })
                }
                className="text-xs text-red-600 font-semibold hover:underline"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                No
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
