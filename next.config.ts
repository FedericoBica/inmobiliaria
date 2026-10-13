import type { NextConfig } from "next";

// Cabeceras de seguridad estáticas (no dependen de nonce por request).
// La Content-Security-Policy (que sí necesita nonce por request) se setea
// en src/proxy.ts, no acá.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // El default de Next (1MB) rechaza antes de llegar a la validación
      // propia de la app cualquier foto/imagen subida vía Server Action.
      // Debe cubrir MAX_UPLOAD_BYTES (15MB, ver src/lib/media-processing.ts)
      // más el overhead de la codificación del request.
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
