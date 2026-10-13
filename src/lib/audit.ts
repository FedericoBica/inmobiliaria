import { db } from "@/db";
import { logAuditoria } from "@/db/schema/auditoria";
import { auth } from "@/auth";
import { getClientIp, getUserAgent } from "@/lib/request-meta";

export type AuditEntry = {
  tabla: string;
  registroId: string;
  accion: "INSERT" | "UPDATE" | "DELETE" | "READ";
  valorAnterior?: Record<string, unknown> | null;
  valorNuevo?: Record<string, unknown> | null;
};

// Un fallo de auditoría nunca debe tumbar la operación principal — por eso
// esta función nunca lanza, solo loguea a consola si algo falla.
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const session = await auth();
    const [ip, userAgent] = await Promise.all([getClientIp(), getUserAgent()]);

    await db.insert(logAuditoria).values({
      actorId: session?.user?.id ?? null,
      actorEmail: session?.user?.email ?? null,
      tabla: entry.tabla,
      registroId: entry.registroId,
      accion: entry.accion,
      valorAnterior: entry.valorAnterior ?? null,
      valorNuevo: entry.valorNuevo ?? null,
      ip,
      userAgent,
    });
  } catch (err) {
    console.error("[audit] No se pudo escribir el log de auditoría", err);
  }
}
