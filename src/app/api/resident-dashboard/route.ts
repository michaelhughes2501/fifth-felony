import { ResidentDashboardController } from "@/controllers/resident-dashboard.controller";
import { NextResponse } from "next/server";

export async function GET() {
  const r = await ResidentDashboardController.summary();
  return r.ok
    ? NextResponse.json({ summary: r.data })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
