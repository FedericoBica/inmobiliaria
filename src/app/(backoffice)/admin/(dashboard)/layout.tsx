import Link from "next/link";
import { auth } from "@/auth";
import { signOut } from "@/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "⊞" },
  { href: "/admin/campos", label: "Campos", icon: "◇" },
  { href: "/admin/agentes", label: "Agentes", icon: "◉" },
];

const ROL_LABEL: Record<string, string> = {
  administrador: "Administrador",
  gerente_comercial: "Gerente comercial",
  agente: "Agente",
  editor_contenido: "Editor",
  solo_lectura: "Solo lectura",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const nombre = session?.user?.name ?? "Usuario";
  const rol = session?.user?.rol ?? "";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#1A1C14] flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <p className="font-display text-lg font-semibold text-white leading-tight">
            Inmobiliaria Rural
          </p>
          <p className="text-[11px] text-white/40 font-mono uppercase tracking-wider mt-0.5">
            Backoffice
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/8 transition-colors text-sm"
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-white text-sm font-medium truncate">{nombre}</p>
          <p className="text-white/40 text-[11px] mt-0.5">{ROL_LABEL[rol] ?? rol}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
            className="mt-3"
          >
            <button
              type="submit"
              className="text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              Cerrar sesión →
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
