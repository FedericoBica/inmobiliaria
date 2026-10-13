"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { agentes, rolEnum } from "@/db/schema/agentes";
import { eq, ne, and, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth-helpers";
import { validatePasswordPolicy } from "@/lib/password-policy";
import { logAudit } from "@/lib/audit";

export type AgenteFormData = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
  password?: string; // solo en alta
};

export type AgenteActionResult = { error: string } | { ok: true; passwordTemporal?: string } | void;

const ROLES_VALIDOS = rolEnum.enumValues;

// Gestión de usuarios es alcance exclusivo de "administrador" (CLAUDE.md,
// tabla de roles). proxy.ts ya bloquea la navegación a /admin/agentes para
// otros roles, pero las Server Actions se verifican acá también — no hay
// que confiar en que siempre se invoquen desde esa ruta.
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  if (session.user.rol !== "administrador") throw new Error("No autorizado");
  return session;
}

function validarDatos(data: AgenteFormData): string | null {
  if (!data.nombre.trim()) return "El nombre es requerido";
  if (!data.apellido.trim()) return "El apellido es requerido";
  if (!data.email.trim() || !data.email.includes("@")) return "El email no es válido";
  if (!ROLES_VALIDOS.includes(data.rol as (typeof ROLES_VALIDOS)[number])) {
    return "El rol seleccionado no es válido";
  }
  return null;
}

// ─── Crear agente ─────────────────────────────────────────────────────────────

export async function crearAgente(data: AgenteFormData): Promise<AgenteActionResult> {
  await requireAdmin();

  const errorDatos = validarDatos(data);
  if (errorDatos) return { error: errorDatos };

  if (!data.password) return { error: "La contraseña temporal es requerida" };

  const policyCheck = await validatePasswordPolicy(data.password);
  if (!policyCheck.ok) return { error: policyCheck.error };

  const passwordHash = await hashPassword(data.password);

  let nuevoId: string;
  try {
    const [row] = await db
      .insert(agentes)
      .values({
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        email: data.email.trim().toLowerCase(),
        telefono: data.telefono.trim() || null,
        rol: data.rol as (typeof ROLES_VALIDOS)[number],
        passwordHash,
        activo: true,
      })
      .returning({ id: agentes.id });
    nuevoId = row.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique")) return { error: "Ya existe un agente con ese email" };
    return { error: `Error al crear: ${msg}` };
  }

  await logAudit({
    tabla: "agentes",
    registroId: nuevoId,
    accion: "INSERT",
    valorNuevo: { nombre: data.nombre, email: data.email, rol: data.rol },
  });

  revalidatePath("/admin/agentes");
  redirect("/admin/agentes");
}

// ─── Actualizar datos/rol/estado ──────────────────────────────────────────────

export async function actualizarAgente(
  id: string,
  data: Omit<AgenteFormData, "password">
): Promise<AgenteActionResult> {
  const session = await requireAdmin();

  const errorDatos = validarDatos(data);
  if (errorDatos) return { error: errorDatos };

  const [existing] = await db.select().from(agentes).where(eq(agentes.id, id));
  if (!existing) return { error: "Agente no encontrado" };

  // Un administrador no puede quitarse a sí mismo el rol de administrador
  // desde este formulario — evita que la cuenta en uso quede sin acceso a
  // gestión de usuarios por error (bloqueo accidental, no de seguridad).
  if (existing.id === session.user.id && data.rol !== "administrador") {
    return { error: "No podés cambiar tu propio rol de administrador" };
  }

  try {
    await db
      .update(agentes)
      .set({
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        email: data.email.trim().toLowerCase(),
        telefono: data.telefono.trim() || null,
        rol: data.rol as (typeof ROLES_VALIDOS)[number],
        updatedAt: new Date(),
      })
      .where(eq(agentes.id, id));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique")) return { error: "Ya existe un agente con ese email" };
    return { error: `Error al guardar: ${msg}` };
  }

  if (existing.rol !== data.rol) {
    await logAudit({
      tabla: "agentes",
      registroId: id,
      accion: "UPDATE",
      valorAnterior: { rol: existing.rol },
      valorNuevo: { rol: data.rol },
    });
  }

  revalidatePath("/admin/agentes");
  redirect("/admin/agentes");
}

// ─── Activar / desactivar ─────────────────────────────────────────────────────

export async function cambiarActivo(id: string, activo: boolean): Promise<void> {
  const session = await requireAdmin();

  if (session.user.id === id && !activo) {
    throw new Error("No podés desactivar tu propia cuenta");
  }

  // Solo puede quedar sin acceso si hay al menos otro administrador activo —
  // si no, nadie podría volver a gestionar usuarios.
  if (!activo) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentes)
      .where(and(eq(agentes.rol, "administrador"), eq(agentes.activo, true), ne(agentes.id, id)));
    const [target] = await db.select({ rol: agentes.rol }).from(agentes).where(eq(agentes.id, id));
    if (target?.rol === "administrador" && count === 0) {
      throw new Error("Debe quedar al menos un administrador activo");
    }
  }

  await db.update(agentes).set({ activo, updatedAt: new Date() }).where(eq(agentes.id, id));

  await logAudit({
    tabla: "agentes",
    registroId: id,
    accion: "UPDATE",
    valorNuevo: { activo },
  });

  revalidatePath("/admin/agentes");
}

// ─── Desbloquear cuenta (reset de intentos fallidos) ─────────────────────────

export async function desbloquearAgente(id: string): Promise<void> {
  await requireAdmin();

  await db
    .update(agentes)
    .set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
    .where(eq(agentes.id, id));

  await logAudit({ tabla: "agentes", registroId: id, accion: "UPDATE", valorNuevo: { desbloqueado: true } });

  revalidatePath("/admin/agentes");
}

// ─── Resetear contraseña ──────────────────────────────────────────────────────
// No hay envío de email todavía (pendiente servicio transaccional) — se
// genera una contraseña temporal y se muestra una sola vez en el momento,
// igual que scripts/seed-admin.ts. El administrador debe comunicarla por un
// canal seguro fuera de banda.

function generarPasswordTemporal(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16) + "!A1";
}

export async function resetearContrasena(id: string): Promise<AgenteActionResult> {
  await requireAdmin();

  const temporal = generarPasswordTemporal();
  const policyCheck = await validatePasswordPolicy(temporal);
  if (!policyCheck.ok) {
    // No debería pasar con el generador actual, pero no se asume.
    return { error: "No se pudo generar una contraseña temporal válida, reintentá" };
  }

  const passwordHash = await hashPassword(temporal);

  await db
    .update(agentes)
    .set({
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(agentes.id, id));

  await logAudit({ tabla: "agentes", registroId: id, accion: "UPDATE", valorNuevo: { passwordReset: true } });

  revalidatePath("/admin/agentes");
  return { ok: true, passwordTemporal: temporal };
}
