import { CommunityController } from "@/controllers/community.controller";
import { NextResponse } from "next/server";

export async function GET() {
  const r = await CommunityController.list();
  return r.ok ? NextResponse.json({ posts: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  const { title, body } = await req.json();
  const r = await CommunityController.create(title, body);
  return r.ok ? NextResponse.json({ post: r.data }, { status: 201 }) : NextResponse.json({ error: r.error }, { status: r.status });
}
