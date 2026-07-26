import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { agentes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateTotpSecret, getTotpUri } from "@/lib/auth-helpers";
import QRCode from "qrcode";
import Setup2faClient from "./Setup2faClient";

export default async function Setup2faPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const agente = await db.query.agentes.findFirst({
    where: eq(agentes.id, session.user.id),
  });

  if (!agente) redirect("/admin/login");

  // Si ya tiene 2FA activo, redirigir al dashboard
  if (agente.totpEnabled) redirect("/admin");

  // Generar nuevo secret (o usar el existente si ya se generó pero no confirmó)
  const secret = agente.totpSecret ?? generateTotpSecret();

  // Guardar el secret (pendiente de confirmación)
  if (!agente.totpSecret) {
    await db
      .update(agentes)
      .set({ totpSecret: secret, updatedAt: new Date() })
      .where(eq(agentes.id, agente.id));
  }

  const otpUri = getTotpUri(secret, agente.email);
  const qrDataUrl = await QRCode.toDataURL(otpUri);

  return <Setup2faClient qrDataUrl={qrDataUrl} secret={secret} />;
}
