import { CaseController } from "@/controllers/case.controller";
import { legalCaseInputSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

export async function GET() {
  const r = await CaseController.listMine();
  return r.ok ? NextResponse.json({ cases: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = legalCaseInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Case number and court are required; check the other fields." }, { status: 400 });
  const r = await CaseController.create(parsed.data);
  return r.ok ? NextResponse.json({ case: r.data }, { status: 201 }) : NextResponse.json({ error: r.error }, { status: r.status });
}
