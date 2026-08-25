import { ApplicationController } from "@/controllers/application.controller";
import { createApplicationSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

export async function GET() {
  const r = await ApplicationController.listMine();
  return r.ok
    ? NextResponse.json({ applications: r.data })
    : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "job_id must be a valid job identifier" },
      { status: 400 }
    );
  }

  const r = await ApplicationController.create(parsed.data.job_id);
  return r.ok
    ? NextResponse.json({ application: r.data }, { status: 201 })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
