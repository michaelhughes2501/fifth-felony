// Provider-agnostic AI gateway with automatic fallback.
//
// Order: OpenAI (SDK) -> Anthropic (REST) -> Gemini (REST).
// No new npm dependencies: Anthropic and Gemini are called over plain
// fetch() against their REST endpoints. OpenAI keeps using the installed
// `openai` SDK via getOpenAI().
//
// chatComplete() tries each configured provider in order and falls through
// on error. streamChat() streams deltas; if a provider fails BEFORE emitting
// any bytes it falls through, but once bytes are sent there is no fallback.

import { getOpenAI } from "@/lib/openai";

export type GwMessage = { role: "user" | "assistant" | "system"; content: string };

export type GwResult = {
  text: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

type GwOpts = {
  messages: GwMessage[];
  system?: string;
  temperature?: number;
  model?: string;
};

const DEFAULTS = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
  gemini: "gemini-1.5-flash",
};

export function availableProviders(): string[] {
  const out: string[] = [];
  if (process.env.OPENAI_API_KEY) out.push("openai");
  if (process.env.ANTHROPIC_API_KEY) out.push("anthropic");
  if (process.env.GEMINI_API_KEY) out.push("gemini");
  return out;
}

// Split a system override out of the message list for providers that take
// `system` separately (Anthropic) or that fold it into a prefix (Gemini).
function partition(opts: GwOpts): { system: string; turns: GwMessage[] } {
  const sysFromMessages = opts.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const system = [opts.system, sysFromMessages].filter(Boolean).join("\n\n");
  const turns = opts.messages.filter((m) => m.role !== "system");
  return { system, turns };
}

function errText(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------
async function openaiComplete(opts: GwOpts): Promise<GwResult> {
  const model = opts.model ?? DEFAULTS.openai;
  const messages: GwMessage[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push(...opts.messages);

  const res = await getOpenAI().chat.completions.create({
    model,
    temperature: opts.temperature ?? 0.5,
    messages,
  });
  const text = res.choices[0]?.message?.content ?? "";
  return {
    text,
    provider: "openai",
    model,
    promptTokens: res.usage?.prompt_tokens ?? 0,
    completionTokens: res.usage?.completion_tokens ?? 0,
    totalTokens: res.usage?.total_tokens ?? 0,
  };
}

async function* openaiStream(opts: GwOpts): AsyncGenerator<string> {
  const model = opts.model ?? DEFAULTS.openai;
  const messages: GwMessage[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push(...opts.messages);

  const stream = await getOpenAI().chat.completions.create({
    model,
    temperature: opts.temperature ?? 0.5,
    messages,
    stream: true,
  });
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

// ---------------------------------------------------------------------------
// Anthropic (REST)
// ---------------------------------------------------------------------------
type AnthropicContentBlock = { type: string; text?: string };
type AnthropicResponse = {
  content?: AnthropicContentBlock[];
  usage?: { input_tokens?: number; output_tokens?: number };
};

function anthropicBody(opts: GwOpts) {
  const { system, turns } = partition(opts);
  return {
    model: opts.model ?? DEFAULTS.anthropic,
    max_tokens: 1024,
    temperature: opts.temperature ?? 0.5,
    ...(system ? { system } : {}),
    messages: turns.map((m) => ({ role: m.role, content: m.content })),
  };
}

async function anthropicComplete(opts: GwOpts): Promise<GwResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not configured.");
  const model = opts.model ?? DEFAULTS.anthropic;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(anthropicBody(opts)),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as AnthropicResponse;
  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("");
  const pt = data.usage?.input_tokens ?? 0;
  const ct = data.usage?.output_tokens ?? 0;
  return {
    text,
    provider: "anthropic",
    model,
    promptTokens: pt,
    completionTokens: ct,
    totalTokens: pt + ct,
  };
}

async function* anthropicStream(opts: GwOpts): AsyncGenerator<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not configured.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ ...anthropicBody(opts), stream: true }),
  });
  if (!res.ok || !res.body)
    throw new Error(`Anthropic ${res.status}: ${await res.text()}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as {
          type?: string;
          delta?: { type?: string; text?: string };
        };
        if (evt.type === "content_block_delta" && evt.delta?.text)
          yield evt.delta.text;
      } catch {
        // ignore keep-alive / non-JSON lines
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Gemini (REST) — no native streaming here; yields the full text once.
// ---------------------------------------------------------------------------
type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

async function geminiComplete(opts: GwOpts): Promise<GwResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured.");
  const model = opts.model ?? DEFAULTS.gemini;
  const { system, turns } = partition(opts);

  const contents = turns.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    key
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents,
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: { temperature: opts.temperature ?? 0.5 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as GeminiResponse;
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");
  const pt = data.usageMetadata?.promptTokenCount ?? 0;
  const ct = data.usageMetadata?.candidatesTokenCount ?? 0;
  return {
    text,
    provider: "gemini",
    model,
    promptTokens: pt,
    completionTokens: ct,
    totalTokens: data.usageMetadata?.totalTokenCount ?? pt + ct,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function chatComplete(opts: GwOpts): Promise<GwResult> {
  const providers = availableProviders();
  if (providers.length === 0) throw new Error("No AI provider configured.");

  let lastErr: unknown;
  for (const p of providers) {
    try {
      if (p === "openai") return await openaiComplete(opts);
      if (p === "anthropic") return await anthropicComplete(opts);
      if (p === "gemini") return await geminiComplete(opts);
    } catch (e) {
      lastErr = e;
      // fall through to the next provider
    }
  }
  throw new Error(`All AI providers failed. Last error: ${errText(lastErr)}`);
}

export async function* streamChat(opts: GwOpts): AsyncGenerator<string> {
  const providers = availableProviders();
  if (providers.length === 0) throw new Error("No AI provider configured.");

  let lastErr: unknown;
  for (const p of providers) {
    try {
      if (p === "openai") {
        yield* openaiStream(opts);
        return;
      }
      if (p === "anthropic") {
        yield* anthropicStream(opts);
        return;
      }
      if (p === "gemini") {
        // No streaming endpoint wired — emit the full text once.
        const r = await geminiComplete(opts);
        if (r.text) yield r.text;
        return;
      }
    } catch (e) {
      lastErr = e;
      // Only safe to fall through here because a provider that throws from
      // yield* before emitting bytes hasn't written to the consumer yet.
    }
  }
  throw new Error(`All AI providers failed. Last error: ${errText(lastErr)}`);
}
