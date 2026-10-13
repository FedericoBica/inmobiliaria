"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db";
import { consultas, estadoConsultaEnum } from "@/db/schema/consultas";
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

const ESTADOS_VALIDOS = estadoConsultaEnum.enumValues;

// Gestión de leads: fuera del alcance de "editor_contenido" y "solo_lectura"
// (CLAUDE.md, tabla de roles) — proxy.ts bloquea la navegación, acá se
// repite para las Server Actions.
async function requireEdicionLeads() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  if (session.user.rol === "editor_contenido" || session.user.rol === "solo_lectura") {
    throw new Error("No autorizado");
  }
  return session;
}

export async function cambiarEstadoConsulta(id: string, estado: string): Promise<void> {
  await requireEdicionLeads();

  if (!ESTADOS_VALIDOS.includes(estado as (typeof ESTADOS_VALIDOS)[number])) {
    throw new Error("Estado inválido");
  }

  const [existing] = await db
    .select({ estado: consultas.estado })
    .from(consultas)
    .where(eq(consultas.id, id));

  await db
    .update(consultas)
    .set({ estado: estado as (typeof ESTADOS_VALIDOS)[number], updatedAt: new Date() })
    .where(eq(consultas.id, id));

  await logAudit({
    tabla: "consultas",
    registroId: id,
    accion: "UPDATE",
    valorAnterior: { estado: existing?.estado ?? null },
    valorNuevo: { estado },
  });

  revalidatePath("/admin/leads");
}

export async function actualizarNotasConsulta(id: string, notas: string): Promise<void> {
  await requireEdicionLeads();

  await db
    .update(consultas)
    .set({ notasInternas: notas.trim() || null, updatedAt: new Date() })
    .where(eq(consultas.id, id));

  revalidatePath("/admin/leads");
}
