"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { media } from "@/db/schema/campo-children";
import { eq, sql } from "drizzle-orm";
import {
  validateMagicBytes,
  processImage,
  MAX_UPLOAD_BYTES,
  MAX_MEDIA_PER_CAMPO,
} from "@/lib/media-processing";
import { uploadBuffer, deleteObjectSafe, keyFromPublicUrl } from "@/lib/storage";

export type MediaActionResult = { ok: true } | { error: string };

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session;
}

const TIPOS_IMAGEN = ["foto", "foto_drone"] as const;
type TipoImagen = (typeof TIPOS_IMAGEN)[number];

export async function subirMedia(
  campoId: string,
  formData: FormData
): Promise<MediaActionResult> {
  await requireSession();

  const file = formData.get("file");
  const tipoRaw = formData.get("tipo");
  const altText = formData.get("altText");

  if (!(file instanceof File)) return { error: "Archivo no recibido" };
  const tipo: TipoImagen = TIPOS_IMAGEN.includes(tipoRaw as TipoImagen)
    ? (tipoRaw as TipoImagen)
    : "foto";

  if (file.size === 0) return { error: "El archivo está vacío" };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: `El archivo supera el límite de ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB` };
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(media)
    .where(eq(media.campoId, campoId));
  if (count >= MAX_MEDIA_PER_CAMPO) {
    return { error: `Este campo ya tiene el máximo de ${MAX_MEDIA_PER_CAMPO} archivos` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Nunca confiar en la extensión ni el Content-Type del navegador
  const formato = validateMagicBytes(buffer);
  if (!formato) {
    return { error: "El archivo no es una imagen válida (jpeg/png/webp)" };
  }

  let processed;
  try {
    processed = await processImage(buffer);
  } catch (err) {
    console.error("[subirMedia] Error procesando imagen", err);
    return { error: "No se pudo procesar la imagen" };
  }

  const baseKey = `campos/${campoId}/${crypto.randomUUID()}`;

  let url: string;
  let urlThumb: string;
  try {
    url = await uploadBuffer(processed.full, `${baseKey}.webp`, processed.contentType);
    urlThumb = await uploadBuffer(
      processed.thumb,
      `${baseKey}-thumb.webp`,
      processed.contentType
    );
  } catch (err) {
    console.error("[subirMedia] Error subiendo al storage", err);
    return {
      error:
        err instanceof Error && err.message.includes("Almacenamiento no configurado")
          ? err.message
          : "No se pudo subir la imagen al almacenamiento",
    };
  }

  await db.insert(media).values({
    campoId,
    tipo,
    url,
    urlThumb,
    altText: typeof altText === "string" && altText.trim() ? altText.trim() : null,
    orden: count,
  });

  revalidatePath(`/admin/campos/${campoId}/editar`);
  return { ok: true };
}

export async function eliminarMedia(mediaId: string, campoId: string): Promise<MediaActionResult> {
  await requireSession();

  const [row] = await db.select().from(media).where(eq(media.id, mediaId));
  if (!row) return { error: "Archivo no encontrado" };

  await db.delete(media).where(eq(media.id, mediaId));

  const key = keyFromPublicUrl(row.url);
  if (key) await deleteObjectSafe(key);
  if (row.urlThumb) {
    const thumbKey = keyFromPublicUrl(row.urlThumb);
    if (thumbKey) await deleteObjectSafe(thumbKey);
  }

  revalidatePath(`/admin/campos/${campoId}/editar`);
  return { ok: true };
}

export async function actualizarAltTextMedia(
  mediaId: string,
  campoId: string,
  altText: string
): Promise<MediaActionResult> {
  await requireSession();
  await db
    .update(media)
    .set({ altText: altText.trim() || null })
    .where(eq(media.id, mediaId));
  revalidatePath(`/admin/campos/${campoId}/editar`);
  return { ok: true };
}

export async function moverMedia(
  campoId: string,
  mediaId: string,
  direccion: "arriba" | "abajo"
): Promise<MediaActionResult> {
  await requireSession();

  const rows = await db
    .select({ id: media.id, orden: media.orden })
    .from(media)
    .where(eq(media.campoId, campoId))
    .orderBy(media.orden);

  const idx = rows.findIndex((r) => r.id === mediaId);
  if (idx === -1) return { error: "Archivo no encontrado" };

  const swapWith = direccion === "arriba" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= rows.length) return { ok: true };

  const a = rows[idx];
  const b = rows[swapWith];

  await db.update(media).set({ orden: b.orden }).where(eq(media.id, a.id));
  await db.update(media).set({ orden: a.orden }).where(eq(media.id, b.id));

  revalidatePath(`/admin/campos/${campoId}/editar`);
  return { ok: true };
}
