"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

// Login único del sitio — hoy solo existen cuentas del backoffice (tabla
// agentes), así que tras ingresar siempre se va a /admin.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Honeypot: si el campo oculto tiene valor, es un bot
    const hp = (e.currentTarget.elements.namedItem("website") as HTMLInputElement)?.value;
    if (hp) return;

    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      // Mensaje genérico — nunca revelar si el email existe o no (anti-enumeración)
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paja flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        {/* Encabezado */}
        <div className="mb-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-trigal mb-2">
            Acceso
          </p>
          <h1 className="font-display text-4xl font-semibold text-tierra leading-tight">
            Iniciá sesión
          </h1>
          <p className="mt-2 text-piedra text-sm">
            ¿No tenés cuenta?{" "}
            <Link href="/registro" className="text-trigal font-semibold hover:underline">
              Registrate gratis
            </Link>
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Honeypot — oculto para humanos, los bots lo completan */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-tierra mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-crema bg-white px-4 py-3 text-sm text-tierra placeholder-piedra focus:outline-none focus:ring-2 focus:ring-trigal"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-tierra">
                Contraseña
              </label>
              <Link href="/recuperar-contrasena" className="text-xs text-piedra hover:text-trigal transition-colors">
                ¿Olvidaste la contraseña?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-crema bg-white px-4 py-3 text-sm text-tierra placeholder-piedra focus:outline-none focus:ring-2 focus:ring-trigal"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* TODO: Cloudflare Turnstile widget aquí antes del submit */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-campo py-3 text-sm font-semibold text-white hover:bg-campo/90 disabled:opacity-60 transition-colors"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

      </div>
    </div>
  );
}
