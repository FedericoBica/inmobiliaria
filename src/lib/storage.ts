import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

// Si no hay STORAGE_ENDPOINT configurado, cae a disco local
// (public/uploads) — sin cuenta ni tarjeta de ningún proveedor. El día que
// se configure un proveedor S3-compatible (R2, Backblaze B2, S3), se activa
// solo con las env vars, sin tocar código ni el resto de la app.
function isLocalMode(): boolean {
  return !process.env.STORAGE_ENDPOINT;
}

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const LOCAL_URL_PREFIX = "/uploads";

// ─── Cliente S3-compatible ────────────────────────────────────────────────

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;

  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
  const endpoint = process.env.STORAGE_ENDPOINT;

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "Almacenamiento no configurado: faltan STORAGE_ACCESS_KEY_ID, " +
        "STORAGE_SECRET_ACCESS_KEY o STORAGE_ENDPOINT en .env.local"
    );
  }

  // "auto" sirve para R2; otros proveedores S3-compatibles (Backblaze B2,
  // AWS S3, etc.) requieren la región real (ej. us-west-004).
  const region = process.env.STORAGE_REGION || "auto";

  client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

function getBucket(): string {
  const bucket = process.env.STORAGE_BUCKET;
  if (!bucket) {
    throw new Error("Almacenamiento no configurado: falta STORAGE_BUCKET en .env.local");
  }
  return bucket;
}

function getPublicUrl(): string {
  const url = process.env.STORAGE_PUBLIC_URL;
  if (!url) {
    throw new Error("Almacenamiento no configurado: falta STORAGE_PUBLIC_URL en .env.local");
  }
  return url.replace(/\/$/, "");
}

// ─── API pública (misma interfaz, sea local o S3) ─────────────────────────

// Sube un buffer y devuelve la URL pública. La key debe ser no adivinable
// (UUID) — nunca basada en el nombre original del archivo.
export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (isLocalMode()) {
    const filePath = path.join(LOCAL_UPLOADS_DIR, key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    return `${LOCAL_URL_PREFIX}/${key}`;
  }

  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${getPublicUrl()}/${key}`;
}

// Best-effort: si falla, no debe tumbar la operación que la llama.
export async function deleteObjectSafe(key: string): Promise<void> {
  try {
    if (isLocalMode()) {
      await unlink(path.join(LOCAL_UPLOADS_DIR, key));
      return;
    }
    await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
  } catch (err) {
    console.error("[storage] No se pudo borrar el objeto", key, err);
  }
}

// Extrae la key a partir de una URL pública ya guardada en DB.
export function keyFromPublicUrl(url: string): string | null {
  if (url.startsWith(`${LOCAL_URL_PREFIX}/`)) {
    return url.slice(LOCAL_URL_PREFIX.length + 1);
  }
  try {
    const base = getPublicUrl();
    return url.startsWith(base) ? url.slice(base.length + 1) : null;
  } catch {
    return null;
  }
}
