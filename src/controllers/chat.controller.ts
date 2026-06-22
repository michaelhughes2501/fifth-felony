import { embed, getOpenAI } from "@/lib/openai";
import { createClient } from "@/lib/supabase-server";
import { chatComplete, streamChat, availableProviders, type GwMessage } from "@/lib/ai-gateway";
import { logUsage } from "@/lib/usage";
import { saveMessage } from "@/lib/conversations";
import type { Result } from "@/types";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

// Optional request context for persistence + usage attribution.
export type ChatContext = {
  userId?: string | null;
  conversationId?: string | null;
  ip?: string;
};

const SYSTEM_PROMPT = `You are the Open Road Assistant, a warm, plain-spoken guide for people rebuilding their lives after incarceration.

Rules:
- Be encouraging, concrete, and respectful. Never use stigmatizing language.
- Ground answers in the CONTEXT provided when it is relevant. If the context doesn't cover something, say so honestly and suggest where to look.
- You are NOT a lawyer or a licensed clinician. For legal or medical questions, give general information, then clearly recommend the user consult a professional or use the resources on this platform.
- If someone expresses thoughts of self-harm or crisis, gently and immediately share the 988 Suicide & Crisis Lifeline (call or text 988) and urge them to reach out.
- Keep answers focused and readable. Use short paragraphs.`;

const SAFE_REPLY =
  "I want to keep this a safe space, so I can't help with that. If you're going through something hard, you don't have to face it alone — you can call or text 988 any time to reach the Suicide & Crisis Lifeline.";

// Returns true when the incoming message should be blocked by moderation.
// Fails open (returns false) so an outage never silences the assistant.
async function isFlagged(userMessage: string): Promise<boolean> {
  try {
    const mod = await getOpenAI().moderations.create({
      model: "omni-moderation-latest",
      input: userMessage,
    });
    return Boolean(mod.results[0]?.flagged);
  } catch {
    return false;
  }
}

// Retrieve relevant knowledge via pgvector. Returns "" on any failure.
async function retrieveContext(userMessage: string): Promise<string> {
  try {
    const queryEmbedding = await embed(userMessage);
    const supabase = createClient();
    const { data: docs } = await supabase.rpc("match_knowledge", {
      query_embedding: queryEmbedding,
      match_count: 4,
    });
    if (docs?.length) {
      return docs
        .map((d: { title: string; content: string }) => `- ${d.title}: ${d.content}`)
        .join("\n");
    }
  } catch {
    // No knowledge base yet / embedding failure — proceed without context.
  }
  return "";
}

// Build the message list sent to the gateway (system + optional context + tail).
function buildMessages(messages: ChatMessage[], context: string): GwMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...(context
      ? [{ role: "system" as const, content: `CONTEXT (local resources & guides):\n${context}` }]
      : []),
    ...messages.slice(-8),
  ];
}

export const ChatController = {
  async respond(
    messages: ChatMessage[],
    ctx?: ChatContext
  ): Promise<Result<{ reply: string }>> {
    if (!Array.isArray(messages) || messages.length === 0)
      return { ok: false, error: "messages required", status: 400 };

    const userMessage = messages[messages.length - 1]?.content ?? "";

    // 1) Guardrail — moderate the incoming message
    if (await isFlagged(userMessage)) return { ok: true, data: { reply: SAFE_REPLY } };

    // 2) Retrieval
    const context = await retrieveContext(userMessage);

    // 3) Generate grounded answer through the provider-agnostic gateway
    try {
      const result = await chatComplete({
        messages: buildMessages(messages, context),
        temperature: 0.5,
      });
      const reply = result.text || "Sorry, I couldn't generate a response.";

      // Best-effort analytics + persistence (never throws).
      await logUsage({
        userId: ctx?.userId ?? null,
        feature: "chat",
        provider: result.provider,
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        meta: { stream: false },
      });
      if (ctx?.conversationId) {
        await saveMessage(ctx.conversationId, "assistant", reply, result.completionTokens);
      }

      return { ok: true, data: { reply } };
    } catch (e) {
      const error = e instanceof Error ? e.message : "Generation failed.";
      return { ok: false, error, status: 500 };
    }
  },

  // Streaming variant. Returns a plain-text UTF-8 stream of deltas. Moderation
  // and RAG run first; if flagged, a one-shot SAFE_REPLY stream is returned.
  async respondStream(
    messages: ChatMessage[],
    ctx?: ChatContext
  ): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder();
    const userMessage = messages[messages.length - 1]?.content ?? "";

    if (await isFlagged(userMessage)) {
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(SAFE_REPLY));
          controller.close();
        },
      });
    }

    const context = await retrieveContext(userMessage);
    const gwMessages = buildMessages(messages, context);

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        let full = "";
        try {
          for await (const delta of streamChat({ messages: gwMessages, temperature: 0.5 })) {
            full += delta;
            controller.enqueue(encoder.encode(delta));
          }
        } catch {
          const msg = full
            ? "\n\n[The response was interrupted. Please try again.]"
            : "Sorry, I couldn't generate a response right now. Please try again.";
          controller.enqueue(encoder.encode(msg));
        } finally {
          controller.close();
        }

        // Post-stream: analytics + persistence (best-effort, never throws).
        const providers = availableProviders();
        await logUsage({
          userId: ctx?.userId ?? null,
          feature: "chat",
          provider: providers[0] ?? "unknown",
          model: "stream",
          completionTokens: 0,
          meta: { stream: true, chars: full.length },
        });
        if (ctx?.conversationId && full) {
          await saveMessage(ctx.conversationId, "assistant", full);
        }
      },
    });
  },
};
