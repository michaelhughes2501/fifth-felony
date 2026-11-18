import { ChatController } from "@/controllers/chat.controller";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const chatSchema = z.object({
  messages: z.array(z.object({
    // Client content is never allowed to supply privileged system/assistant roles.
    role: z.literal('user'),
    content: z.string().min(1).max(10000),
  }).strict()).min(1).max(20),
}).strict().refine((value) => value.messages.reduce((total, message) => total + message.content.length, 0) <= 30000);

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = req.headers.get('x-real-ip') || forwardedFor?.split(',').at(-1)?.trim() || 'unknown';
    const rateLimitKey = `chat:${ip}`;
    
    if (!checkRateLimit(rateLimitKey, 20, 60 * 60 * 1000)) { // 20 requests per hour
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 20 requests per hour.' },
        { status: 429 }
      );
    }

    // Input validation
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const validation = chatSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request format', details: validation.error.issues }, { status: 400 });
    }
    const validatedData = validation.data;
    const { messages } = validatedData;

    const r = await ChatController.respond(messages);
    return r.ok ? NextResponse.json(r.data) : NextResponse.json({ error: r.error }, { status: r.status });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
