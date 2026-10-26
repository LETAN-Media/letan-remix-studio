import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export async function writeAudit(input: {
  actorId: string;
  projectId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}) {
  await getDb().insert(auditLogs).values({
    actorId: input.actorId,
    projectId: input.projectId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    requestId: input.requestId ?? crypto.randomUUID(),
    metadata: input.metadata ?? {},
  });
}
