// Chat conversation persistence. All functions are graceful: they return
// null / [] on any failure and never throw, so chat keeps working even when
// Supabase is unconfigured or offline.

import { createServiceClient } from "@/lib/supabase-server";

export type StoredMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokens: number | null;
  created_at: string;
};

function titleFrom(message?: string): string {
  const t = (message ?? "").trim().replace(/\s+/g, " ");
  if (!t) return "New conversation";
  return t.length > 60 ? `${t.slice(0, 57)}...` : t;
}

// Returns an existing conversation id (when given + owned) or creates a new
// one for the user. Returns null if persistence is unavailable.
export async function getOrCreateConversation(
  userId: string | null | undefined,
  conversationId?: string | null,
  firstUserMessage?: string
): Promise<string | null> {
  if (!userId) return null;
  try {
    const supabase = createServiceClient();

    if (conversationId) {
      const { data } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", userId)
        .single();
      if (data?.id) return data.id as string;
    }

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: userId, title: titleFrom(firstUserMessage) })
      .select("id")
      .single();
    if (error || !data?.id) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

export async function saveMessage(
  conversationId: string | null | undefined,
  role: "user" | "assistant" | "system",
  content: string,
  tokens?: number
): Promise<void> {
  if (!conversationId) return;
  try {
    const supabase = createServiceClient();
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role,
      content,
      tokens: tokens ?? null,
    });
    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  } catch {
    // Non-critical.
  }
}

export async function listMessages(
  conversationId: string | null | undefined
): Promise<StoredMessage[]> {
  if (!conversationId) return [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    return (data as StoredMessage[]) ?? [];
  } catch {
    return [];
  }
}
