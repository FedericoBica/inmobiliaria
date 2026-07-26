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
    // No tiene 2FA configurado — redirigir a setup
    return NextResponse.json({ error: "setup_requerido" }, { status: 400 });
  }

  const valido = verifyTotp(agente.totpSecret, token);
  if (!valido) {
    return NextResponse.json({ error: "token_invalido" }, { status: 400 });
  }

  // Marcar el token JWT como 2FA verificado mediante update de sesión
  // NextAuth v5 no expone update() desde el server — lo manejamos via cookie custom
  // La sesión se marca como verificada en el cliente tras este 200
  return NextResponse.json({ ok: true });
}
