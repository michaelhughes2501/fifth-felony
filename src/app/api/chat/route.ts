import { ChatController, type ChatContext } from "@/controllers/chat.controller";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase-server";
import { getOrCreateConversation, saveMessage } from "@/lib/conversations";
import { chatRequestSchema, getClientIp } from "@/lib/request-validation";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    if (!checkRateLimit(`chat:${ip}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 20 requests per hour." },
        { status: 429 }
      );
    }

    const body: unknown = await req.json();
    const validatedData = chatRequestSchema.parse(body);
    const { messages, conversationId, stream } = validatedData;

    let userId: string | null = null;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Anonymous / unconfigured: continue without attribution.
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const convoId = await getOrCreateConversation(userId, conversationId, lastUser?.content);
    if (convoId && lastUser) await saveMessage(convoId, "user", lastUser.content);

    const ctx: ChatContext = { userId, conversationId: convoId, ip };

    if (stream) {
      const responseBody = await ChatController.respondStream(messages, ctx);
      return new Response(responseBody, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          ...(convoId ? { "X-Conversation-Id": convoId } : {}),
        },
      });
    }

    const result = await ChatController.respond(messages, ctx);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ...result.data,
      ...(convoId ? { conversationId: convoId } : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request format.", details: error.issues }, { status: 400 });
    }

    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
