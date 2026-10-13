"use client";

import { useState } from "react";
import Link from "next/link";

const DEPARTAMENTOS = [
  "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno",
  "Flores", "Florida", "Lavalleja", "Maldonado", "Paysandú",
  "Río Negro", "Rivera", "Rocha", "Salto", "San José",
  "Soriano", "Tacuarembó", "Treinta y Tres",
];

const APTITUDES = [
  { value: "ganadera",          label: "Ganadero" },
  { value: "agricola",          label: "Agrícola" },
  { value: "agricola_ganadera", label: "Agrícola–Ganadero" },
  { value: "lechera",           label: "Lechero" },
  { value: "forestal",          label: "Forestal" },
  { value: "arrocera",          label: "Arrocero" },
];

export default function RegistroPage() {
  const [nombre, setNombre]       = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [dptos, setDptos]         = useState<string[]>([]);
  const [aptitudes, setAptitudes] = useState<string[]>([]);
  const [alertas, setAlertas]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  function toggleDpto(d: string) {
    setDptos((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  function toggleAptitud(a: string) {
    setAptitudes((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Honeypot: si el campo oculto tiene valor, es un bot
    const hp = (e.currentTarget.elements.namedItem("website") as HTMLInputElement)?.value;
    if (hp) return;

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // TODO: Server Action de registro de usuario público
      await new Promise((r) => setTimeout(r, 900));
      setSuccess(true);
    } catch {
      setError("Ocurrió un error. Intentá nuevamente en unos minutos.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-paja flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          <p className="font-display text-6xl text-campo mb-4">✓</p>
          <h2 className="font-display text-3xl font-semibold text-tierra mb-3">
            ¡Cuenta creada!
          </h2>
          <p className="text-piedra text-sm leading-relaxed mb-6">
            Revisá tu bandeja de entrada para confirmar el email y activar tu cuenta.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-campo px-6 py-3 text-sm font-semibold text-white hover:bg-campo/90 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paja min-h-[calc(100vh-4rem)] py-16 px-4">
      <div className="mx-auto max-w-lg">

        {/* Encabezado */}
        <div className="mb-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-trigal mb-2">
            Cuenta gratuita
          </p>
          <h1 className="font-display text-4xl font-semibold text-tierra leading-tight">
            Registrate
          </h1>
          <p className="mt-2 text-piedra text-sm">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-trigal font-semibold hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* Honeypot — invisible para humanos */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          {/* Datos básicos */}
          <div className="bg-white rounded-2xl border border-crema p-5 space-y-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-piedra">
              Datos personales
            </p>

            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-tierra mb-1">
                Nombre y apellido
              </label>
              <input
                id="nombre"
                type="text"
                autoComplete="name"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-crema px-4 py-3 text-sm text-tierra placeholder-piedra focus:outline-none focus:ring-2 focus:ring-trigal"
                placeholder="Juan Pérez"
              />
            </div>

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
                className="w-full rounded-lg border border-crema px-4 py-3 text-sm text-tierra placeholder-piedra focus:outline-none focus:ring-2 focus:ring-trigal"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-tierra mb-1">
                Contraseña{" "}
                <span className="text-piedra font-normal">(mín. 8 caracteres)</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-crema px-4 py-3 text-sm text-tierra placeholder-piedra focus:outline-none focus:ring-2 focus:ring-trigal"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-tierra mb-1">
                Confirmar contraseña
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full rounded-lg border px-4 py-3 text-sm text-tierra placeholder-piedra focus:outline-none focus:ring-2 focus:ring-trigal ${
                  confirm && confirm !== password
                    ? "border-red-300 bg-red-50"
                    : "border-crema"
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Preferencias de alertas */}
          <div className="bg-white rounded-2xl border border-crema p-5 space-y-4">
            <div className="flex items-start gap-3">
              <input
                id="alertas"
                type="checkbox"
                checked={alertas}
                onChange={(e) => setAlertas(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-crema accent-campo"
              />
              <label htmlFor="alertas" className="text-sm text-tierra leading-snug cursor-pointer">
                <span className="font-medium">Recibir alertas de nuevos ingresos</span>
                <span className="block text-piedra text-xs mt-0.5">
                  Te avisamos cuando se publican campos que coinciden con tus intereses.
                </span>
              </label>
            </div>

            {alertas && (
              <>
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-piedra mb-2">
                    Departamentos de interés
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DEPARTAMENTOS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDpto(d)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          dptos.includes(d)
                            ? "bg-campo text-white"
                            : "bg-crema text-tierra hover:bg-crema/70"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-piedra mb-2">
                    Aptitud de interés
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {APTITUDES.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => toggleAptitud(a.value)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          aptitudes.includes(a.value)
                            ? "bg-trigal text-white"
                            : "bg-crema text-tierra hover:bg-crema/70"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
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
            className="w-full rounded-lg bg-campo py-3.5 text-sm font-semibold text-white hover:bg-campo/90 disabled:opacity-60 transition-colors"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta gratuita"}
          </button>

          <p className="text-center text-xs text-piedra">
            Al registrarte aceptás nuestra{" "}
            <Link href="/privacidad" className="underline hover:text-tierra transition-colors">
              política de privacidad
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
