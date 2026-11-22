import { CaseController } from "@/controllers/case.controller";
import { legalCaseInputSchema, uuidParamSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid case id" }, { status: 400 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = legalCaseInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Case number and court are required; check the other fields." }, { status: 400 });
  const r = await CaseController.update(parsedId.data, parsed.data);
  return r.ok ? NextResponse.json({ case: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid case id" }, { status: 400 });
  const r = await CaseController.remove(parsedId.data);
  return r.ok ? NextResponse.json({ deleted: r.data.id }) : NextResponse.json({ error: r.error }, { status: r.status });
}
