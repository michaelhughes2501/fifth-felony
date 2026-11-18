import { CommunityController } from "@/controllers/community.controller";
import { NextResponse } from "next/server";
import { communityCreateSchema, parseJson } from "@/lib/request-validation";

export async function GET() {
  const r = await CommunityController.list();
  return r.ok
    ? NextResponse.json({ posts: r.data })
    : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  const body = await parseJson(req, communityCreateSchema);
  if (!body) return NextResponse.json({ error: "Invalid community post" }, { status: 400 });
  const r = await CommunityController.create(body.title, body.body);
  return r.ok
    ? NextResponse.json({ post: r.data }, { status: 201 })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
