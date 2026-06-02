import { ResidentDashboardController } from "@/controllers/resident-dashboard.controller";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const r = await ResidentDashboardController.createCheckIn(body);
  return r.ok
    ? NextResponse.json({ check_in: r.data }, { status: 201 })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
