// Roll Call API — daily status check-in for supervised reentry.
// GET  /api/roll-call  — return today check-in + recent history for signed-in user
// POST /api/roll-call  — create today check-in (delegates to ResidentDashboardController)
import { NextRequest, NextResponse } from "next/server";
import { ResidentDashboardController } from "@/controllers/resident-dashboard.controller";
import { createClient, isSupabaseConfigured } from "@/lib/supabase-server";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ today: null, history: [] });
  try {
    const supabase = createClient();
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayRes, historyRes] = await Promise.all([
      supabase
        .from("daily_check_ins")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("daily_check_ins")
        .select("id, status, mood_score, points_awarded, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(14),
    ]);

    return NextResponse.json({
      today:   todayRes.data   ?? null,
      history: historyRes.data ?? [],
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const r = await ResidentDashboardController.createCheckIn(body);
  return r.ok
    ? NextResponse.json({ check_in: r.data }, { status: 201 })
    : NextResponse.json({ error: r.error }, { status: r.status });
}
