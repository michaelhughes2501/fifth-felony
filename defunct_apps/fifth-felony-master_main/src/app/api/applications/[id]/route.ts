import { ApplicationController } from "@/controllers/application.controller";
import { NextResponse } from "next/server";
import { applicationStatusSchema, parseJson, uuidSchema } from "@/lib/request-validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid application id" }, { status: 400 });
  const body = await parseJson(req, applicationStatusSchema);
  if (!body) return NextResponse.json({ error: "Invalid application status" }, { status: 400 });
  const { status } = body;
  const r = await ApplicationController.updateStatus(id, status);
  return r.ok ? NextResponse.json({ application: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid application id" }, { status: 400 });
  const r = await ApplicationController.remove(id);
  return r.ok ? NextResponse.json({ deleted: r.data.id }) : NextResponse.json({ error: r.error }, { status: r.status });
}
