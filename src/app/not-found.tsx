import Link from "next/link";
import Navbar from "@/components/ui/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paja flex flex-col">

      <Navbar />

      {/* Contenido 404 */}
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-lg">

          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-trigal mb-4">
            Error 404
          </p>

          <h1 className="font-display text-6xl sm:text-7xl font-semibold text-tierra leading-none mb-6">
            Página no<br />
            <em className="italic text-campo">encontrada.</em>
          </h1>

          <p className="text-piedra text-lg leading-relaxed mb-10">
            La dirección que buscás no existe o fue movida.
            Podés volver al inicio o explorar los campos disponibles.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="rounded-lg bg-campo px-6 py-3 text-sm font-semibold text-white hover:bg-campo/90 transition-colors"
            >
              Volver al inicio
            </Link>
            <Link
              href="/campos"
              className="rounded-lg border border-trigal px-6 py-3 text-sm font-semibold text-trigal hover:bg-trigal hover:text-white transition-colors"
            >
              Ver campos disponibles
            </Link>
          </div>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="bg-[#0F1209] border-t border-white/10 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/30 text-xs font-mono">
            © {new Date().getFullYear()} Inmobiliaria Rural · Todos los derechos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}
