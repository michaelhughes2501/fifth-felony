import { ChatController, type ChatContext } from "@/controllers/chat.controller";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase-server";
import { getOrCreateConversation, saveMessage } from "@/lib/conversations";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(10000),
  })).min(1).max(50),
  conversationId: z.string().uuid().optional(),
  stream: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `chat:${ip}`;

    if (!checkRateLimit(rateLimitKey, 20, 60 * 60 * 1000)) { // 20 requests per hour
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 20 requests per hour.' },
        { status: 429 }
      );
    }

    // Input validation
    const body = await req.json();
    const validatedData = chatSchema.parse(body);
    const { messages, conversationId, stream } = validatedData;

    // Best-effort: resolve the signed-in user from the session.
    let userId: string | null = null;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Anonymous / unconfigured — proceed without attribution.
    }

    // Best-effort: persist the conversation + incoming user message.
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const convoId = await getOrCreateConversation(userId, conversationId, lastUser?.content);
    if (convoId && lastUser) {
      await saveMessage(convoId, 'user', lastUser.content);
    }

    const ctx: ChatContext = { userId, conversationId: convoId, ip };

    if (stream) {
      const body = await ChatController.respondStream(messages, ctx);
      return new Response(body, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          ...(convoId ? { 'X-Conversation-Id': convoId } : {}),
        },
      });
    }

    const r = await ChatController.respond(messages, ctx);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json({ ...r.data, ...(convoId ? { conversationId: convoId } : {}) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
