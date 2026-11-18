import { CommunityController } from "@/controllers/community.controller";
import { communityPatchSchema, uuidParamSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const patch = communityPatchSchema.safeParse(body);
  if (!patch.success) return NextResponse.json({ error: "Invalid community post", issues: patch.error.flatten() }, { status: 400 });
  const result = await CommunityController.update(parsedId.data, patch.data);
  return result.ok ? NextResponse.json({ post: result.data }) : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  const result = await CommunityController.remove(parsedId.data);
  return result.ok ? NextResponse.json({ deleted: result.data.id }) : NextResponse.json({ error: result.error }, { status: result.status });
}
