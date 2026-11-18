import { CommunityController } from "@/controllers/community.controller";
import { communityPostInputSchema, parseJson, uuidSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  const patch = await parseJson(req, communityPostInputSchema);
  if (!patch) return NextResponse.json({ error: "Invalid community post" }, { status: 400 });
  const r = await CommunityController.update(id, patch);
  return r.ok ? NextResponse.json({ post: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  const r = await CommunityController.remove(id);
  return r.ok ? NextResponse.json({ deleted: r.data.id }) : NextResponse.json({ error: r.error }, { status: r.status });
}
