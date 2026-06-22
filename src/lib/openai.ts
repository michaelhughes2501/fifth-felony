import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

// Retry with exponential backoff + jitter on transient failures
// (HTTP 429 / 5xx / network errors). Pure, no new deps.
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number }
): Promise<T> {
  const retries = opts?.retries ?? 3;
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? Number((err as { status?: unknown }).status)
          : undefined;
      const transient =
        status === undefined ||
        status === 429 ||
        (status >= 500 && status < 600);
      if (attempt > retries || !transient) throw err;
      const base = 250 * 2 ** (attempt - 1);
      const jitter = base * 0.25 * Math.random();
      await new Promise((r) => setTimeout(r, base + jitter));
    }
  }
}

export async function embed(text: string): Promise<number[]> {
  const res = await withRetry(() =>
    getOpenAI().embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    })
  );
  return res.data[0].embedding;
}
