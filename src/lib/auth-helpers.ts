import { db } from "@/db";
import { agentes } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authenticator } from "@otplib/preset-default";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function verifyCredentials(email: string, password: string) {
  const agente = await db.query.agentes.findFirst({
    where: eq(agentes.email, email.toLowerCase()),
  });

  if (!agente || !agente.activo) return { error: "credenciales_invalidas" };

  // Verificar si la cuenta está bloqueada
  if (agente.lockedUntil && agente.lockedUntil > new Date()) {
    const minutosRestantes = Math.ceil(
      (agente.lockedUntil.getTime() - Date.now()) / 60000
    );
    return { error: "cuenta_bloqueada", minutosRestantes };
  }

  const passwordOk = await bcrypt.compare(password, agente.passwordHash);

  if (!passwordOk) {
    const nuevosFallos = agente.failedLoginAttempts + 1;
    const bloqueado = nuevosFallos >= MAX_FAILED_ATTEMPTS;

    await db
      .update(agentes)
      .set({
        failedLoginAttempts: nuevosFallos,
        lockedUntil: bloqueado
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(agentes.id, agente.id));

    return {
      error: bloqueado ? "cuenta_bloqueada" : "credenciales_invalidas",
      intentosRestantes: bloqueado ? 0 : MAX_FAILED_ATTEMPTS - nuevosFallos,
    };
  }

  // Login correcto — resetear contadores
  await db
    .update(agentes)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(agentes.id, agente.id));

  return { agente };
}

export function verifyTotp(secret: string, token: string): boolean {
  return authenticator.verify({ token, secret });
}

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function getTotpUri(secret: string, email: string): string {
  return authenticator.keyuri(email, "Inmobiliaria Rural", secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
