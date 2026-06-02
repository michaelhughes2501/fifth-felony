import { JobController } from "@/controllers/job.controller";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const r = await JobController.get(id);
  return r.ok ? NextResponse.json({ job: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const patch = await req.json();
  const r = await JobController.update(id, patch);
  return r.ok ? NextResponse.json({ job: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const r = await JobController.remove(id);
  return r.ok ? NextResponse.json({ deleted: r.data.id }) : NextResponse.json({ error: r.error }, { status: r.status });
}
