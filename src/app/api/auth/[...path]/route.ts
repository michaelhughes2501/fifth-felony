// FeloniousApps · Open Road · Created 2026-11-17
import { NextResponse } from "next/server";
import { getNeonAuth, isNeonAuthConfigured, NEON_AUTH_NOT_CONFIGURED } from "@/lib/neon-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

function unavailable() {
  return NextResponse.json({ error: NEON_AUTH_NOT_CONFIGURED }, { status: 503 });
}

export async function GET(request: Request, ctx: Ctx) {
  if (!isNeonAuthConfigured()) return unavailable();
  return getNeonAuth().handler().GET(request, ctx);
}

export async function POST(request: Request, ctx: Ctx) {
  if (!isNeonAuthConfigured()) return unavailable();
  return getNeonAuth().handler().POST(request, ctx);
}
