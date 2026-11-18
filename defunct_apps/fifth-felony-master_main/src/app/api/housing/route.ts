import { HousingController } from "@/controllers/housing.controller";
import { canManageResources } from "@/lib/resource-authorization";
import { housingInputSchema, parseJson } from "@/lib/request-validation";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 100) || undefined;
  const r = await HousingController.list(q);
  return r.ok ? NextResponse.json({ housing: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  if (!(await canManageResources())) return NextResponse.json({ error: "Admin or provider role required" }, { status: 403 });
  const body = await parseJson(req, housingInputSchema);
  if (!body) return NextResponse.json({ error: "Invalid housing resource" }, { status: 400 });
  const r = await HousingController.create(body);
  return r.ok ? NextResponse.json({ item: r.data }, { status: 201 }) : NextResponse.json({ error: r.error }, { status: r.status });
}
