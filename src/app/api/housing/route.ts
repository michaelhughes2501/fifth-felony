import { HousingController } from "@/controllers/housing.controller";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || undefined;
  const r = await HousingController.list(q);
  return r.ok ? NextResponse.json({ housing: r.data }) : NextResponse.json({ error: r.error }, { status: r.status });
}

export async function POST(req: Request) {
  const body = await req.json();
  const r = await HousingController.create(body);
  return r.ok ? NextResponse.json({ item: r.data }, { status: 201 }) : NextResponse.json({ error: r.error }, { status: r.status });
}
