import { LegalController } from "@/controllers/legal.controller";
import { canManageResources } from "@/lib/resource-authorization";
import { legalInputSchema, parseJson, uuidSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };
const invalidId = () => NextResponse.json({ error: "Invalid resource id" }, { status: 400 });

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return invalidId();
  const r = await LegalController.get(id);
  return r.ok ? NextResponse.json({ item: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return invalidId();
  if (!(await canManageResources())) return NextResponse.json({ error: "Admin or provider role required" }, { status: 403 });
  const patch = await parseJson(req, legalInputSchema.partial());
  if (!patch || Object.keys(patch).length === 0) return NextResponse.json({ error: "Invalid legal resource" }, { status: 400 });
  const r = await LegalController.update(id, patch);
  return r.ok ? NextResponse.json({ item: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return invalidId();
  if (!(await canManageResources())) return NextResponse.json({ error: "Admin or provider role required" }, { status: 403 });
  const r = await LegalController.remove(id);
  return r.ok ? NextResponse.json({ deleted: r.data.id }) : NextResponse.json({ error: r.error }, { status: r.status });
}
