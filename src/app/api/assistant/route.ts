// Lightweight assistant endpoint — delegates to ChatController (OpenAI + RAG).
// Falls back to a helpful static reply when OPENAI_API_KEY is not configured.
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-validation";
import { z } from "zod";

const STATIC_RESPONSES: { test: RegExp; reply: string }[] = [
  { test: /\b(job|work|employ|hire|career)\b/i, reply: "For fair-chance employment, focus on trades, staffing agencies, and employers with fair-chance hiring policies. Check the Jobs board on this platform for available listings." },
  { test: /\b(hous|rent|apartment|shelter|transitional)\b/i, reply: "Look for transitional housing through local reentry programs and the Housing board here. If you face a housing dispute, consider contacting a qualified legal-aid provider." },
  { test: /\b(expunge|seal|record|legal|right|law|lawyer|attorney)\b/i, reply: "Record-clearing rules depend on your state and case. The Legal Aid section can help you identify appropriate professional resources." },
  { test: /\b(parole|probation|officer|check.?in|supervision)\b/i, reply: "Keep your supervision requirements and appointments organized. If you are unsure about a requirement, ask your supervising officer or another qualified professional for clarification." },
];

const DEFAULT_REPLY = "I'm here to help with reentry resources such as jobs, housing, legal services, and community support. What do you need help with today?";

const assistantRequestSchema = z.object({
  message: z.string().trim().min(1).max(10_000),
});

function staticReply(message: string): string {
  for (const { test, reply } of STATIC_RESPONSES) {
    if (test.test(message)) return reply;
  }
  return DEFAULT_REPLY;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    if (!checkRateLimit(`assistant:${ip}`, 30, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }

    const body: unknown = await req.json();
    const parsed = assistantRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request format." }, { status: 400 });
    }

    const { message } = parsed.data;

    if (process.env.OPENAI_API_KEY) {
      try {
        const { ChatController } = await import("@/controllers/chat.controller");
        const r = await ChatController.respond([{ role: "user", content: message }]);
        if (r.ok) {
          return NextResponse.json({ response: r.data.reply, timestamp: new Date().toISOString() });
        }
      } catch {
        // Fall through to static response so the endpoint remains available.
      }
    }

    return NextResponse.json({
      response: staticReply(message),
      timestamp: new Date().toISOString(),
      mode: "static",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
