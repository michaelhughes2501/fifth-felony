import { LegalController } from "@/controllers/legal.controller";
import { legalInputSchema } from "@/lib/request-validation";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || undefined;
  const r = await LegalController.list(q);
  return r.ok
    ? NextResponse.json({ legal: r.data })
    : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = legalInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid legal resource payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const r = await LegalController.create(parsed.data);
  return r.ok
    ? NextResponse.json({ item: r.data }, { status: 201 })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
