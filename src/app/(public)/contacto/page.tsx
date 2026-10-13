import Link from "next/link";
import { getNonce } from "@/lib/nonce";
import ContactoForm from "@/components/contacto/ContactoForm";

export const metadata = {
  title: "Contacto — Inmobiliaria Rural Uruguay",
  description: "Hablá con nosotros: consultas, campos para vender o arrendar, y dudas generales.",
};

export default async function ContactoPage() {
  const nonce = await getNonce();
  const whatsappNumber = process.env.WHATSAPP_PHONE || "598XXXXXXXXX";
  const waMsg = encodeURIComponent("Hola, quería hacer una consulta.");

  return (
    <div className="bg-[#FBF8F3] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-crema">
        <div className="max-w-screen-xl mx-auto px-6 py-5">
          <nav className="flex items-center gap-1.5 text-xs text-piedra mb-3">
            <Link href="/" className="hover:text-tierra transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-tierra">Contacto</span>
          </nav>
          <h1 className="font-display text-[2rem] font-semibold text-tierra leading-tight">Contacto</h1>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12">
          {/* Columna izquierda — quiénes somos + vías de contacto */}
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-trigal mb-3">
              Quiénes somos
            </p>
            <p className="text-tierra text-lg leading-relaxed mb-6">
              Somos una inmobiliaria rural especializada en el mercado agropecuario uruguayo.
              Competimos por profundidad de datos, no por volumen de avisos: cada campo que publicamos
              tiene desglose CONEAT, polígono real sobre satelital y ficha técnica completa, para que
              el productor o inversor sepa exactamente qué está mirando antes de viajar a verlo.
            </p>
            <p className="text-piedra leading-relaxed mb-10">
              Si estás buscando un campo, querés vender o arrendar el tuyo, o simplemente tenés una
              consulta, escribinos por el canal que prefieras.
            </p>

            <div className="space-y-4">
              <a
                href={`https://wa.me/${whatsappNumber}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-crema bg-white px-5 py-4 hover:border-trigal transition-colors"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] font-semibold">
                  W
                </span>
                <div>
                  <p className="font-semibold text-tierra text-sm">WhatsApp</p>
                  <p className="text-piedra text-xs">Respuesta más rápida</p>
                </div>
              </a>

              <div className="flex items-center gap-3 rounded-xl border border-crema bg-white px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-trigal/10 text-trigal font-semibold">
                  @
                </span>
                <div>
                  <p className="font-semibold text-tierra text-sm">Email</p>
                  <p className="text-piedra text-xs">{process.env.EMAIL_FROM || "contacto@inmobiliariarural.uy"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha — formulario */}
          <div className="bg-white rounded-2xl border border-crema p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-tierra mb-1">Envianos un mensaje</h2>
            <p className="text-piedra text-sm mb-6">Te respondemos a la brevedad.</p>
            <ContactoForm nonce={nonce} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-crema bg-white">
        <div className="max-w-screen-xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center gap-4 text-sm text-piedra">
          <p className="font-display text-base font-semibold text-campo">Inmobiliaria Rural Uruguay</p>
          <p className="md:ml-auto">© {new Date().getFullYear()} · Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
}
