import { auth } from "@/auth";
import { db } from "@/db";
import { agentes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyTotp } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "no_autenticado" }, { status: 401 });
  }

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token_requerido" }, { status: 400 });
  }

  const agente = await db.query.agentes.findFirst({
    where: eq(agentes.id, session.user.id),
  });

  if (!agente?.totpSecret) {
    return NextResponse.json({ error: "secret_no_encontrado" }, { status: 400 });
  }

  // Confirmar que el usuario puede generar un código válido
  const valido = verifyTotp(agente.totpSecret, token);
  if (!valido) {
    return NextResponse.json({ error: "token_invalido" }, { status: 400 });
  }

  // Activar 2FA definitivamente
  await db
    .update(agentes)
    .set({ totpEnabled: true, updatedAt: new Date() })
    .where(eq(agentes.id, agente.id));

  return NextResponse.json({ ok: true });
}
