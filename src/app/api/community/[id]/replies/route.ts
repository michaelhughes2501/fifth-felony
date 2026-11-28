import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { query, queryOne, ensureProfile } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { communityReplySchema, uuidParamSchema, getClientIp } from "@/lib/request-validation";

type Ctx = { params: Promise<{ id: string }> };
type Reply = {
  id: string;
  post_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  author: { id: string; full_name: string | null } | null;
};

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  try {
    const rows = await query<Reply>(
      `SELECT r.*, CASE WHEN p.id IS NULL THEN NULL ELSE json_build_object('id',p.id,'full_name',p.full_name) END AS author
       FROM community_replies r LEFT JOIN profiles p ON p.id=r.author_id
       WHERE r.post_id=$1 ORDER BY r.created_at`,
      [parsedId.data],
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Could not load replies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const ip = getClientIp(req.headers);
  if (!checkRateLimit(`community-reply:${ip}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } }
    );
  }

  const auth = createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await params;
  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid post id" }, { status: 400 });

  try { await ensureProfile(user.id, user.user_metadata?.full_name ?? null); }
  catch { return NextResponse.json({ error: "Could not initialize profile" }, { status: 500 }); }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = communityReplySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid reply body" }, { status: 400 });

  try {
    const row = await queryOne<Reply>(
      "INSERT INTO community_replies(post_id,author_id,body) VALUES($1,$2,$3) RETURNING *",
      [parsedId.data, user.id, parsed.data.body],
    );
    return row
      ? NextResponse.json(row, { status: 201 })
      : NextResponse.json({ error: "Could not save reply" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Could not save reply" }, { status: 500 });
  }
}
