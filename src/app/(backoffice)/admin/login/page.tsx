import { redirect } from "next/navigation";

// El login es único para todo el sitio — se mantiene esta ruta solo para no
// romper enlaces o marcadores viejos.
export default function AdminLoginRedirect() {
  redirect("/login");
}
