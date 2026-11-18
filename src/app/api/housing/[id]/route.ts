import { HousingController } from "@/controllers/housing.controller";
import { housingPatchSchema, uuidParamSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

function idFrom(value: string) {
  return uuidParamSchema.safeParse(value);
}

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = idFrom(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid housing id" }, { status: 400 });
  const result = await HousingController.get(parsedId.data);
  return result.ok ? NextResponse.json({ item: result.data }) : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = idFrom(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid housing id" }, { status: 400 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const patch = housingPatchSchema.safeParse(body);
  if (!patch.success) return NextResponse.json({ error: "Invalid housing payload", issues: patch.error.flatten() }, { status: 400 });
  const result = await HousingController.update(parsedId.data, patch.data);
  return result.ok ? NextResponse.json({ item: result.data }) : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = idFrom(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid housing id" }, { status: 400 });
  const result = await HousingController.remove(parsedId.data);
  return result.ok ? NextResponse.json({ deleted: result.data.id }) : NextResponse.json({ error: result.error }, { status: result.status });
}
