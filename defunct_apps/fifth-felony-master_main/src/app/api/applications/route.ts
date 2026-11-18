import { ApplicationController } from "@/controllers/application.controller";
import { NextResponse } from "next/server";
import { applicationCreateSchema, parseJson } from "@/lib/request-validation";

export async function GET() {
  const r = await ApplicationController.listMine();
  return r.ok
    ? NextResponse.json({ applications: r.data })
    : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  const body = await parseJson(req, applicationCreateSchema);
  if (!body) return NextResponse.json({ error: "Invalid application request" }, { status: 400 });
  const r = await ApplicationController.create(body.job_id);
  return r.ok
    ? NextResponse.json({ application: r.data }, { status: 201 })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
