import { CommunityController } from "@/controllers/community.controller";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const r = await CommunityController.update(id, patch);
  return r.ok ? NextResponse.json({ post: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const r = await CommunityController.remove(id);
  return r.ok ? NextResponse.json({ deleted: r.data.id }) : NextResponse.json({ error: r.error }, { status: r.status });
}
