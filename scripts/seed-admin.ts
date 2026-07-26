import { db } from "../src/db";
import { agentes } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth-helpers";

const ADMIN = {
  nombre: "Admin",
  apellido: "Principal",
  email: "admin@inmobiliaria.com",
  password: "CambiarEsto123!",
  rol: "administrador" as const,
};

async function seed() {
  console.log("Creando administrador inicial...");

  const passwordHash = await hashPassword(ADMIN.password);

  await db
    .insert(agentes)
    .values({
      nombre: ADMIN.nombre,
      apellido: ADMIN.apellido,
      email: ADMIN.email,
      passwordHash,
      rol: ADMIN.rol,
      activo: true,
    })
    .onConflictDoNothing({ target: agentes.email });

  console.log("✓ Administrador creado");
  console.log(`  Email:      ${ADMIN.email}`);
  console.log(`  Contraseña: ${ADMIN.password}`);
  console.log("\nIMPORTANTE: Cambiá la contraseña después del primer login.");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
