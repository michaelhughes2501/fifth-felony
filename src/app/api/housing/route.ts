import { HousingController } from "@/controllers/housing.controller";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || undefined;
  const r = await HousingController.list(q);
  return r.ok
    ? NextResponse.json({ housing: r.data })
    : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const r = await HousingController.create(body);
  return r.ok
    ? NextResponse.json({ item: r.data }, { status: 201 })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
