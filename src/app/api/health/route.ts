import { NextResponse } from "next/server";
import { checkDatabase, isDatabaseConfigured } from "@/lib/db";
import { isNeonAuthConfigured } from "@/lib/neon-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ status: "not_configured", database: "neon" }, { status: 503 });
  }
  try {
    await checkDatabase();
    const auth = isNeonAuthConfigured() ? "configured" : "not_configured";
    return NextResponse.json({ status: "ok", database: "neon", auth });
  } catch {
    return NextResponse.json({ status: "unavailable", database: "neon" }, { status: 503 });
  }
}
