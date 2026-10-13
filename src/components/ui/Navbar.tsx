import Link from "next/link";

export default function Navbar() {
  return (
    <header className="bg-[#0F1209] sticky top-0 z-50 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-semibold text-white tracking-tight">
              Inmobiliaria Rural
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/campos" className="text-white/70 hover:text-white text-sm transition-colors">
              Campos
            </Link>
            <Link href="/informes" className="text-white/70 hover:text-white text-sm transition-colors">
              Informes
            </Link>
            <Link href="/contacto" className="text-white/70 hover:text-white text-sm transition-colors">
              Contacto
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-white/70 hover:text-white text-sm transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/contacto"
              className="rounded-lg bg-trigal px-4 py-2 text-sm font-semibold text-white hover:bg-[#8A6E14] transition-colors"
            >
              Publicar campo
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
