// Lightweight assistant endpoint — delegates to ChatController (OpenAI + RAG).
// Falls back to a helpful static reply when OPENAI_API_KEY is not configured.
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const STATIC_RESPONSES: { test: RegExp; reply: string }[] = [
  {
    test: /\b(job|work|employ|hire|career)\b/i,
    reply:
      "For felon-friendly jobs, focus on trades (construction, manufacturing, trucking), staffing agencies, and companies with fair-chance hiring policies. Check the Jobs board on this platform — every listing there welcomes people with a record.",
  },
  {
    test: /\b(hous|rent|apartment|shelter|transitional)\b/i,
    reply:
      "Many cities have reentry housing programs. Look for transitional housing through your parole or probation officer, search the Housing board here for fair-chance landlords, and contact Legal Aid for tenant-rights help if you face discrimination.",
  },
  {
    test: /\b(expunge|seal|record|legal|right|law|lawyer|attorney)\b/i,
    reply:
      "Your rights depend on your state and conviction type. Many records can be sealed or expunged after a waiting period. Check the Legal Aid page for free clinics near you, or contact the National Reentry Resource Center at 1-800-848-4450.",
  },
  {
    test: /\b(depress|anx|stress|mental|counsel|thera|feel|overwhelm|crisis)\b/i,
    reply:
      "You're not alone. The Mental Health page lists free and sliding-scale counseling options. If you're in crisis right now, call or text 988 — the Suicide & Crisis Lifeline is free and available 24/7.",
  },
  {
    test: /\b(parole|probation|officer|check.?in|supervision)\b/i,
    reply:
      "Make sure you have your supervision officer's contact info saved and attend every scheduled check-in. If you're unsure about a requirement, ask in writing so there's a record. The Roll Call feature here can help you track your daily compliance.",
  },
];

const DEFAULT_REPLY =
  "I'm here to help with your reentry journey — jobs, housing, legal rights, mental health, and more. What do you need help with today?";

function staticReply(message: string): string {
  for (const { test, reply } of STATIC_RESPONSES) {
    if (test.test(message)) return reply;
  }
  return DEFAULT_REPLY;
}

export async function POST(req: NextRequest) {
  // Rate-limit by IP: 30 requests per hour
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(`assistant:${ip}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before sending another message." },
      { status: 429 }
    );
  }

  const body: Record<string, unknown> = await req.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  // If OpenAI is configured, delegate to the chat controller (RAG + moderation)
  if (process.env.OPENAI_API_KEY) {
    try {
      const { ChatController } = await import("@/controllers/chat.controller");
      const msgs = [{ role: "user" as const, content: message }];
      const r = await ChatController.respond(msgs);
      if (r.ok) return NextResponse.json({ response: r.data.reply, timestamp: new Date().toISOString() });
    } catch {
      // Fall through to static reply
    }
  }

  // Static fallback (works without any API key)
  return NextResponse.json({
    response: staticReply(message),
    timestamp: new Date().toISOString(),
    mode: "static",
  });
}
