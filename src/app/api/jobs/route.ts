import { JobController } from "@/controllers/job.controller";
import { createJobSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || undefined;
  const r = await JobController.list(q);
  return r.ok
    ? NextResponse.json({ jobs: r.data })
    : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid job payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const r = await JobController.create(parsed.data);
  return r.ok
    ? NextResponse.json({ job: r.data }, { status: 201 })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
