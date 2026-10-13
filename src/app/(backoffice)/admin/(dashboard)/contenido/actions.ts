"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { contenidos, tipoContenidoEnum } from "@/db/schema/contenido";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/slugify";
import {
  validateMagicBytes,
  processImage,
  MAX_UPLOAD_BYTES,
} from "@/lib/media-processing";
import { uploadBuffer } from "@/lib/storage";

export type ContenidoFormData = {
  tipo: string;
  titulo: string;
  slug: string;
  extracto: string;
  cuerpo: string;
  imagenDestacada: string;
  publicado: boolean;
};

export type ContenidoActionResult = { error: string } | { ok: true } | void;

const TIPOS_VALIDOS = tipoContenidoEnum.enumValues;

// Contenido editorial: alcance de administrador, gerente_comercial y
// editor_contenido (CLAUDE.md, tabla de roles). proxy.ts ya bloquea el
// resto de roles a nivel de ruta, se repite acá para las Server Actions.
async function requireEdicionContenido() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  if (!["administrador", "gerente_comercial", "editor_contenido"].includes(session.user.rol)) {
    throw new Error("No autorizado");
  }
  return session;
}

function buildSlug(data: ContenidoFormData): string {
  return data.slug.trim() ? slugify(data.slug) : slugify(data.titulo);
}

function validar(data: ContenidoFormData): string | null {
  if (!TIPOS_VALIDOS.includes(data.tipo as (typeof TIPOS_VALIDOS)[number])) return "Tipo inválido";
  if (!data.titulo.trim()) return "El título es requerido";
  if (!data.cuerpo.trim()) return "El cuerpo es requerido";
  return null;
}

export async function crearContenido(data: ContenidoFormData): Promise<ContenidoActionResult> {
  const session = await requireEdicionContenido();

  const errorDatos = validar(data);
  if (errorDatos) return { error: errorDatos };

  let id: string;
  try {
    const [row] = await db
      .insert(contenidos)
      .values({
        tipo: data.tipo as (typeof TIPOS_VALIDOS)[number],
        titulo: data.titulo.trim(),
        slug: buildSlug(data),
        extracto: data.extracto.trim() || null,
        cuerpo: data.cuerpo,
        imagenDestacada: data.imagenDestacada.trim() || null,
        publicado: data.publicado,
        autorId: session.user.id,
        publishedAt: data.publicado ? new Date() : null,
      })
      .returning({ id: contenidos.id });
    id = row.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique")) return { error: "Ya existe un contenido con ese slug" };
    return { error: `Error al crear: ${msg}` };
  }

  revalidatePath("/admin/contenido");
  redirect(`/admin/contenido/${id}/editar`);
}

export async function actualizarContenido(
  id: string,
  data: ContenidoFormData
): Promise<ContenidoActionResult> {
  await requireEdicionContenido();

  const errorDatos = validar(data);
  if (errorDatos) return { error: errorDatos };

  const [existing] = await db.select().from(contenidos).where(eq(contenidos.id, id));
  if (!existing) return { error: "Contenido no encontrado" };

  try {
    await db
      .update(contenidos)
      .set({
        tipo: data.tipo as (typeof TIPOS_VALIDOS)[number],
        titulo: data.titulo.trim(),
        slug: buildSlug(data),
        extracto: data.extracto.trim() || null,
        cuerpo: data.cuerpo,
        imagenDestacada: data.imagenDestacada.trim() || null,
        publicado: data.publicado,
        publishedAt: data.publicado ? (existing.publishedAt ?? new Date()) : null,
        updatedAt: new Date(),
      })
      .where(eq(contenidos.id, id));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique")) return { error: "Ya existe un contenido con ese slug" };
    return { error: `Error al guardar: ${msg}` };
  }

  revalidatePath("/admin/contenido");
  revalidatePath(`/admin/contenido/${id}/editar`);
  redirect("/admin/contenido");
}

export async function eliminarContenido(id: string): Promise<ContenidoActionResult> {
  await requireEdicionContenido();
  await db.delete(contenidos).where(eq(contenidos.id, id));
  revalidatePath("/admin/contenido");
}

// ─── Imagen destacada ─────────────────────────────────────────────────────────
// Misma validación que la carga de fotos de campos: magic bytes, nunca
// extensión/Content-Type, y reencode con sharp (elimina EXIF/payloads).

export async function subirImagenDestacada(formData: FormData): Promise<
  { url: string } | { error: string }
> {
  await requireEdicionContenido();

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Archivo no recibido" };
  if (file.size === 0) return { error: "El archivo está vacío" };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: `El archivo supera el límite de ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const formato = validateMagicBytes(buffer);
  if (!formato) return { error: "El archivo no es una imagen válida (jpeg/png/webp)" };

  let processed;
  try {
    processed = await processImage(buffer);
  } catch (err) {
    console.error("[subirImagenDestacada] Error procesando imagen", err);
    return { error: "No se pudo procesar la imagen" };
  }

  try {
    const url = await uploadBuffer(
      processed.full,
      `contenido/${crypto.randomUUID()}.webp`,
      processed.contentType
    );
    return { url };
  } catch (err) {
    console.error("[subirImagenDestacada] Error subiendo al storage", err);
    return {
      error:
        err instanceof Error && err.message.includes("Almacenamiento no configurado")
          ? err.message
          : "No se pudo subir la imagen al almacenamiento",
    };
  }
}
