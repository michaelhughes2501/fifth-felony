import { ApplicationController } from "@/controllers/application.controller";
import { applicationStatusSchema, uuidParamSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid application id" }, { status: 400 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = applicationStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid application status" }, { status: 400 });
  const result = await ApplicationController.updateStatus(parsedId.data, parsed.data.status);
  return result.ok ? NextResponse.json({ application: result.data }) : NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid application id" }, { status: 400 });
  const result = await ApplicationController.remove(parsedId.data);
  return result.ok ? NextResponse.json({ deleted: result.data.id }) : NextResponse.json({ error: result.error }, { status: result.status });
}
