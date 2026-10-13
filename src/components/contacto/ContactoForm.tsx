"use client";

import { useState, useTransition } from "react";
import { crearContactoGeneral } from "@/app/(public)/contacto/contacto-actions";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

export default function ContactoForm({ nonce }: { nonce?: string }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [consentimientoMarketing, setConsentimientoMarketing] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<"idle" | "ok">("idle");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!consentimiento) return;

    const honeypot =
      (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)
        ?.value ?? "";

    const formData = new FormData();
    formData.set("website", honeypot);
    formData.set("nombre", nombre);
    formData.set("email", email);
    formData.set("telefono", telefono);
    formData.set("mensaje", mensaje);
    formData.set("consentimiento", consentimiento ? "on" : "");
    formData.set("consentimientoMarketing", consentimientoMarketing ? "on" : "");
    formData.set("turnstileToken", turnstileToken);

    startTransition(async () => {
      const result = await crearContactoGeneral(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEstado("ok");
    });
  }

  const inputCls =
    "w-full rounded-lg border border-crema bg-white px-3.5 py-2.5 text-sm text-tierra placeholder-piedra focus:outline-none focus:ring-2 focus:ring-trigal";

  if (estado === "ok") {
    return (
      <div className="text-center py-10">
        <p className="text-campo font-display text-xl font-semibold mb-1">¡Mensaje enviado!</p>
        <p className="text-piedra text-sm">Te contactamos a la brevedad.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text" placeholder="Nombre y apellido" required
          value={nombre} onChange={(e) => setNombre(e.target.value)}
          className={inputCls}
        />
        <input
          type="tel" placeholder="Teléfono / WhatsApp" required
          value={telefono} onChange={(e) => setTelefono(e.target.value)}
          className={inputCls}
        />
      </div>
      <input
        type="email" placeholder="Email (opcional)"
        value={email} onChange={(e) => setEmail(e.target.value)}
        className={inputCls}
      />
      <textarea
        rows={4} placeholder="Contanos en qué te podemos ayudar" required
        value={mensaje} onChange={(e) => setMensaje(e.target.value)}
        className={`${inputCls} resize-none`}
      />

      <label className="flex gap-2.5 items-start cursor-pointer">
        <input
          type="checkbox" required
          checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-trigal shrink-0"
        />
        <span className="text-[11px] text-piedra leading-relaxed">
          Acepto que mis datos sean usados para responder este mensaje.{" "}
          <a href="/privacidad" className="underline hover:text-tierra">
            Política de privacidad.
          </a>
        </span>
      </label>

      <label className="flex gap-2.5 items-start cursor-pointer">
        <input
          type="checkbox"
          checked={consentimientoMarketing}
          onChange={(e) => setConsentimientoMarketing(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-trigal shrink-0"
        />
        <span className="text-[11px] text-piedra leading-relaxed">
          Quiero recibir novedades y campos por email (opcional).
        </span>
      </label>

      <TurnstileWidget nonce={nonce} onVerify={setTurnstileToken} />

      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !consentimiento}
        className="w-full sm:w-auto rounded-xl bg-trigal px-8 py-3 text-sm font-semibold text-white hover:bg-[#8A6E14] disabled:opacity-50 transition-colors"
      >
        {isPending ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
