import { JobController } from "@/controllers/job.controller";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || undefined;
  const r = await JobController.list(q);
  return r.ok ? NextResponse.json({ jobs: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const r = await JobController.create(body);
  return r.ok ? NextResponse.json({ job: r.data }, { status: 201 }) : NextResponse.json({ error: r.error }, { status: r.status });
}
