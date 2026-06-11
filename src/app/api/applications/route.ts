import { ApplicationController } from "@/controllers/application.controller";
import { NextResponse } from "next/server";

export async function GET() {
  const r = await ApplicationController.listMine();
  return r.ok
    ? NextResponse.json({ applications: r.data })
    : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const job_id = body.job_id as string | undefined;
  const r = await ApplicationController.create(job_id as string);
  return r.ok
    ? NextResponse.json({ application: r.data }, { status: 201 })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
