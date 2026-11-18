import { LegalController } from "@/controllers/legal.controller";
import { legalPatchSchema, uuidParamSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid legal resource id" }, { status: 400 });
  const result = await LegalController.get(parsedId.data);
  return result.ok ? NextResponse.json({ item: result.data }) : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid legal resource id" }, { status: 400 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const patch = legalPatchSchema.safeParse(body);
  if (!patch.success) return NextResponse.json({ error: "Invalid legal resource payload", issues: patch.error.flatten() }, { status: 400 });
  const result = await LegalController.update(parsedId.data, patch.data);
  return result.ok ? NextResponse.json({ item: result.data }) : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid legal resource id" }, { status: 400 });
  const result = await LegalController.remove(parsedId.data);
  return result.ok ? NextResponse.json({ deleted: result.data.id }) : NextResponse.json({ error: result.error }, { status: result.status });
}
