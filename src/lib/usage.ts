// AI usage logging. Best-effort: inserts into usage_logs via the service
// client and NEVER throws — a logging failure must not break a chat reply.

import { createServiceClient } from "@/lib/supabase-server";

export async function logUsage(e: {
  userId?: string | null;
  feature: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from("usage_logs").insert({
      user_id: e.userId ?? null,
      feature: e.feature,
      provider: e.provider,
      model: e.model,
      prompt_tokens: e.promptTokens ?? 0,
      completion_tokens: e.completionTokens ?? 0,
      total_tokens:
        e.totalTokens ?? (e.promptTokens ?? 0) + (e.completionTokens ?? 0),
      meta: e.meta ?? {},
    });
  } catch {
    // Swallow — usage logging is non-critical.
  }
}
