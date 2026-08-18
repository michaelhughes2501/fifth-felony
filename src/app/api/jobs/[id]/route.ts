import { JobController } from "@/controllers/job.controller";
import { updateJobSchema, uuidParamSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

function validateId(id: string) {
  return uuidParamSchema.safeParse(id);
}

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = validateId(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid job id" }, { status: 400 });

  const r = await JobController.get(parsedId.data);
  return r.ok ? NextResponse.json({ job: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = validateId(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid job id" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch = updateJobSchema.safeParse(body);
  if (!patch.success) {
    return NextResponse.json({ error: "Invalid job payload", issues: patch.error.flatten() }, { status: 400 });
  }

  const r = await JobController.update(parsedId.data, patch.data);
  return r.ok ? NextResponse.json({ job: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = validateId(id);
  if (!parsedId.success) return NextResponse.json({ error: "Invalid job id" }, { status: 400 });

  const r = await JobController.remove(parsedId.data);
  return r.ok ? NextResponse.json({ deleted: r.data.id }) : NextResponse.json({ error: r.error }, { status: r.status });
}
