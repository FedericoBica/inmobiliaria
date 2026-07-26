import Link from "next/link";
import CampoForm from "@/components/backoffice/CampoForm";

export default function NuevoCampoPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Link href="/admin" className="hover:text-gray-600">Admin</Link>
          <span>/</span>
          <Link href="/admin/campos" className="hover:text-gray-600">Campos</Link>
          <span>/</span>
          <span className="text-gray-700">Nuevo</span>
        </nav>
        <h1 className="font-display text-3xl font-semibold text-gray-900">Nuevo campo</h1>
      </div>

      <CampoForm />
    </div>
  );
}
