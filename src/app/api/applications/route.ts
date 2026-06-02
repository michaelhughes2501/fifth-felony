import { ApplicationController } from "@/controllers/application.controller";
import { NextResponse } from "next/server";

export async function GET() {
  const r = await ApplicationController.listMine();
  return r.ok ? NextResponse.json({ applications: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  const { job_id } = await req.json();
  const r = await ApplicationController.create(job_id);
  return r.ok ? NextResponse.json({ application: r.data }, { status: 201 }) : NextResponse.json({ error: r.error }, { status: r.status });
}
