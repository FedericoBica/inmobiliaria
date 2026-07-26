"use client";

import { useState } from "react";

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="12" y1="12" x2="12" y2="18" />
    <line x1="9" y1="15" x2="12" y2="18" /><line x1="15" y1="15" x2="12" y2="18" />
  </svg>
);

type Props = {
  referencia: string;
  campoId: string;
  whatsappNumber?: string;
  precioDisplay: string;
  precioTotal?: string | null;
};

// ─── Barra fija mobile (siempre visible mientras se hace scroll) ──────────────

export function CTAFlotanteMobile({ referencia, whatsappNumber = "598XXXXXXXXX" }: Props) {
  const msg = encodeURIComponent(
    `Hola, consulto por el campo ${referencia}. ¿Me pueden dar más información?`
  );

  function scrollAConsulta() {
    document.getElementById("consulta")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-crema px-4 py-3 flex gap-3 lg:hidden shadow-lg">
      <a
        href={`https://wa.me/${whatsappNumber}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center gap-2 h-12 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1da851] transition-colors"
      >
        <WhatsAppIcon />
        WhatsApp
      </a>
      <button
        onClick={scrollAConsulta}
        className="flex flex-1 items-center justify-center h-12 rounded-xl bg-trigal text-white font-semibold text-sm hover:bg-[#8A6E14] transition-colors"
      >
        Consultar
      </button>
    </div>
  );
}

// ─── Sidebar de contacto (desktop) ───────────────────────────────────────────

export function CTAContactoSidebar({
  referencia,
  campoId,
  whatsappNumber = "598XXXXXXXXX",
  precioDisplay,
  precioTotal,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");

  const msg = encodeURIComponent(
    `Hola, consulto por el campo ${referencia}. ¿Me pueden dar más información?`
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consentimiento) return;
    setEstado("enviando");
    // TODO: POST /api/consultas
    await new Promise((r) => setTimeout(r, 700));
    setEstado("ok");
  }

  const inputCls =
    "w-full rounded-lg border border-crema bg-white px-3.5 py-2.5 text-sm text-tierra placeholder-piedra focus:outline-none focus:ring-2 focus:ring-trigal";

  return (
    <div id="consulta" className="bg-white rounded-2xl border border-crema shadow-sm overflow-hidden">
      {/* Precio */}
      <div className="bg-campo px-5 py-4">
        <p className="text-white/55 text-[11px] font-mono uppercase tracking-wider mb-1">Precio</p>
        <p className="font-display text-[2rem] font-semibold text-[#D4BC6A] leading-none">
          {precioDisplay}
        </p>
        {precioTotal && (
          <p className="text-white/55 text-sm mt-1.5">{precioTotal} total</p>
        )}
      </div>

      {/* WhatsApp */}
      <div className="px-5 pt-5 pb-4 border-b border-crema">
        <a
          href={`https://wa.me/${whatsappNumber}?text=${msg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1da851] transition-colors"
        >
          <WhatsAppIcon />
          Consultar por WhatsApp
        </a>
        <p className="text-center text-piedra text-xs mt-2">Respuesta inmediata · Mensaje precargado</p>
      </div>

      {/* Formulario */}
      <div className="px-5 py-5">
        <p className="text-sm font-semibold text-tierra mb-4">O enviá una consulta</p>

        {estado === "ok" ? (
          <div className="text-center py-6">
            <p className="text-campo font-semibold mb-1">¡Consulta enviada!</p>
            <p className="text-piedra text-sm">Te contactamos a la brevedad.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text" placeholder="Nombre y apellido" required
              value={nombre} onChange={(e) => setNombre(e.target.value)}
              className={inputCls}
            />
            <input
              type="email" placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
            <input
              type="tel" placeholder="Teléfono / WhatsApp" required
              value={telefono} onChange={(e) => setTelefono(e.target.value)}
              className={inputCls}
            />
            <textarea
              rows={3} placeholder="Mensaje (opcional)"
              value={mensaje} onChange={(e) => setMensaje(e.target.value)}
              className={`${inputCls} resize-none`}
            />

            {/* Consentimiento obligatorio — Ley 18.331 URCDP */}
            <label className="flex gap-2.5 items-start cursor-pointer">
              <input
                type="checkbox" required
                checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-trigal shrink-0"
              />
              <span className="text-[11px] text-piedra leading-relaxed">
                Acepto que mis datos sean usados para responder esta consulta.{" "}
                <a href="/privacidad" className="underline hover:text-tierra">
                  Política de privacidad.
                </a>
              </span>
            </label>

            <button
              type="submit"
              disabled={estado === "enviando" || !consentimiento}
              className="w-full rounded-xl bg-trigal py-3 text-sm font-semibold text-white hover:bg-[#8A6E14] disabled:opacity-50 transition-colors"
            >
              {estado === "enviando" ? "Enviando..." : "Enviar consulta"}
            </button>
          </form>
        )}

        {/* PDF */}
        <div className="mt-4 pt-4 border-t border-crema">
          <a
            href={`/api/campos/${campoId}/pdf`}
            className="flex items-center justify-center gap-2 w-full text-piedra text-sm hover:text-tierra transition-colors py-1"
          >
            <DownloadIcon />
            Descargar ficha técnica PDF
          </a>
        </div>
      </div>
    </div>
  );
}
