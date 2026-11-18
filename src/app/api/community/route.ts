import { CommunityController } from "@/controllers/community.controller";
import { communityCreateSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await CommunityController.list();
  return result.ok
    ? NextResponse.json({ posts: result.data })
    : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = communityCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid community post", issues: parsed.error.flatten() }, { status: 400 });
  }
  const result = await CommunityController.create(parsed.data.title, parsed.data.body);
  return result.ok
    ? NextResponse.json({ post: result.data }, { status: 201 })
    : NextResponse.json({ error: result.error }, { status: result.status });
}
