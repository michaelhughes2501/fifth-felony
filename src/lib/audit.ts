// Audit logging. Best-effort: inserts into audit_logs via the service client
// and NEVER throws. Do NOT call from edge middleware (service client is
// node-only) — use it from node-runtime routes/server actions.

import { createServiceClient } from "@/lib/supabase-server";

export async function logAudit(e: {
  actorId?: string | null;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from("audit_logs").insert({
      actor_id: e.actorId ?? null,
      action: e.action,
      target: e.target ?? null,
      meta: e.meta ?? {},
      ip: e.ip ?? null,
    });
  } catch {
    // Swallow — audit logging is non-critical.
  }
}
