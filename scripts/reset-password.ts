import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { agentes } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth-helpers";
import { validatePasswordPolicy } from "../src/lib/password-policy";

// Uso: npm run reset:password -- <email> <nueva-contraseña>
// Resetea la contraseña y desbloquea la cuenta.
async function reset() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Uso: npm run reset:password -- <email> <nueva-contraseña>");
    process.exit(1);
  }

  const policyCheck = await validatePasswordPolicy(password);
  if (!policyCheck.ok) {
    console.error(`✗ Contraseña rechazada: ${policyCheck.error}`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const updated = await db
    .update(agentes)
    .set({
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(agentes.email, email.toLowerCase()))
    .returning({ email: agentes.email });

  if (updated.length === 0) {
    console.error(`✗ No existe un agente con email ${email}`);
    process.exit(1);
  }

  console.log(`✓ Contraseña reseteada para ${updated[0].email}`);
  console.log("\nIMPORTANTE: Cambiá la contraseña después del próximo login.");

  process.exit(0);
}

reset().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
