import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_MEDIA_PER_CAMPO = 40;

export type ImageFormat = "jpeg" | "png" | "webp";

// Valida el tipo real del archivo por sus primeros bytes (magic numbers) —
// nunca confiar en la extensión ni en el Content-Type que manda el cliente.
export function validateMagicBytes(buffer: Buffer): ImageFormat | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  // WEBP: "RIFF"...."WEBP"
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

export type ProcessedImage = {
  full: Buffer;
  thumb: Buffer;
  contentType: string;
};

// Reencodea la imagen con sharp (esto por sí solo descarta EXIF/GPS y
// cualquier payload embebido, ya que no se llama a .withMetadata()),
// generando una variante completa y un thumbnail.
export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
  const pipeline = sharp(buffer, { failOn: "error" }).rotate(); // rotate() aplica la orientación EXIF antes de descartarla

  const full = await pipeline
    .clone()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const thumb = await pipeline
    .clone()
    .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  return { full, thumb, contentType: "image/webp" };
}
