import { CommunityController } from "@/controllers/community.controller";
import { NextResponse } from "next/server";

export async function GET() {
  const r = await CommunityController.list();
  return r.ok
    ? NextResponse.json({ posts: r.data })
    : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  let parsed: Record<string, unknown>;
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const title = parsed.title as string | undefined;
  const body = parsed.body as string | undefined;
  const r = await CommunityController.create(title as string, body as string);
  return r.ok
    ? NextResponse.json({ post: r.data }, { status: 201 })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
