import { embed, getOpenAI } from "@/lib/openai";
import { createClient } from "@/lib/supabase-server";
import type { Result } from "@/types";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `You are the Open Road Assistant, a warm, plain-spoken guide for people rebuilding their lives after incarceration.

Rules:
- Be encouraging, concrete, and respectful. Never use stigmatizing language.
- Ground answers in the CONTEXT provided when it is relevant. If the context doesn't cover something, say so honestly and suggest where to look.
- You are NOT a lawyer or a licensed clinician. For legal or medical questions, give general information, then clearly recommend the user consult a professional or use the resources on this platform.
- If someone expresses thoughts of self-harm or crisis, gently and immediately share the 988 Suicide & Crisis Lifeline (call or text 988) and urge them to reach out.
- Keep answers focused and readable. Use short paragraphs.`;

const SAFE_REPLY =
  "I want to keep this a safe space, so I can't help with that. If you're going through something hard, you don't have to face it alone — you can call or text 988 any time to reach the Suicide & Crisis Lifeline.";

export const ChatController = {
  async respond(messages: ChatMessage[]): Promise<Result<{ reply: string }>> {
    if (!Array.isArray(messages) || messages.length === 0)
      return { ok: false, error: "messages required", status: 400 };

    const userMessage = messages[messages.length - 1]?.content ?? "";

    // 1) Guardrail — moderate the incoming message
    try {
      const mod = await getOpenAI().moderations.create({
        model: "omni-moderation-latest",
        input: userMessage,
      });
      if (mod.results[0]?.flagged) return { ok: true, data: { reply: SAFE_REPLY } };
    } catch {
      // Fail safe: continue; the system prompt still enforces tone/safety.
    }

    // 2) Retrieval — pull relevant knowledge via pgvector
    let context = "";
    try {
      const queryEmbedding = await embed(userMessage);
      const supabase = createClient();
      const { data: docs } = await supabase.rpc("match_knowledge", {
        query_embedding: queryEmbedding,
        match_count: 4,
      });
      if (docs?.length) {
        context = docs
          .map((d: { title: string; content: string }) => `- ${d.title}: ${d.content}`)
          .join("\n");
      }
    } catch {
      // No knowledge base yet / embedding failure — proceed without context
    }

    // 3) Generate grounded answer
    try {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...(context
            ? [{ role: "system" as const, content: `CONTEXT (local resources & guides):\n${context}` }]
            : []),
          ...messages.slice(-8),
        ],
      });
      const reply =
        completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
      return { ok: true, data: { reply } };
    } catch (e: any) {
      return { ok: false, error: e.message, status: 500 };
    }
  },
};
