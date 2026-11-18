import { LegalController } from "@/controllers/legal.controller";
import { canManageResources } from "@/lib/resource-authorization";
import { legalInputSchema, parseJson } from "@/lib/request-validation";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 100) || undefined;
  const r = await LegalController.list(q);
  return r.ok ? NextResponse.json({ legal: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  if (!(await canManageResources())) return NextResponse.json({ error: "Admin or provider role required" }, { status: 403 });
  const body = await parseJson(req, legalInputSchema);
  if (!body) return NextResponse.json({ error: "Invalid legal resource" }, { status: 400 });
  const r = await LegalController.create(body);
  return r.ok ? NextResponse.json({ item: r.data }, { status: 201 }) : NextResponse.json({ error: r.error }, { status: r.status });
}
