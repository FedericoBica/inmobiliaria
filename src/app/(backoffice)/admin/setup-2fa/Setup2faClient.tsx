"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Setup2faClient({
  qrDataUrl,
  secret,
}: {
  qrDataUrl: string;
  secret: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/confirmar-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Código incorrecto. Escaneá el QR de nuevo e intentá.");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Configurar verificación en dos pasos
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Escaneá el código QR con Google Authenticator, Authy u otra
            aplicación compatible.
          </p>
        </div>

        <div className="flex justify-center mb-4">
          <Image
            src={qrDataUrl}
            alt="Código QR para 2FA"
            width={200}
            height={200}
            className="rounded-lg border border-gray-200"
          />
        </div>

        <details className="mb-6 text-center">
          <summary className="text-xs text-gray-400 cursor-pointer select-none">
            No puedo escanear — mostrar clave manual
          </summary>
          <p className="mt-2 font-mono text-xs bg-gray-100 rounded px-3 py-2 break-all select-all">
            {secret}
          </p>
        </details>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Código de confirmación
            </label>
            <input
              id="token"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              required
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="000000"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || token.length !== 6}
            className="w-full bg-gray-900 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {loading ? "Confirmando..." : "Confirmar y activar 2FA"}
          </button>
        </form>
      </div>
    </div>
  );
}
