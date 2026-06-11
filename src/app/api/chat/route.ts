import { ChatController } from "@/controllers/chat.controller";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(10000),
  })).min(1).max(50),
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
    const { messages } = validatedData;

    const r = await ChatController.respond(messages);
    return r.ok ? NextResponse.json(r.data) : NextResponse.json({ error: r.error }, { status: r.status });
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
