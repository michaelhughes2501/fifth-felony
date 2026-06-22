// Mental health check-in API — wraps the resident-dashboard daily_check_ins table.
// POST: create a check-in for the signed-in user
// GET:  retrieve the current user's recent check-ins
import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured, SUPABASE_NOT_CONFIGURED } from "@/lib/supabase-server";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ checkins: [] });
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const { data, error } = await supabase
      .from("daily_check_ins")
      .select("id, status, mood_score, support_needed, notes, points_awarded, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return NextResponse.json({ checkins: data ?? [] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured())
    return NextResponse.json({ error: SUPABASE_NOT_CONFIGURED }, { status: 401 });
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const body: Record<string, unknown> = await req.json().catch(() => ({}));
    const moodScore = Number(body.mood_score);
    const status = (body.status as string) || "steady";
    const notes  = typeof body.notes === "string" ? body.notes.trim().slice(0, 1200) : null;

    if (!["steady", "needs_support", "urgent"].includes(status)) {
      return NextResponse.json(
        { error: "status must be steady, needs_support, or urgent" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(moodScore) || moodScore < 1 || moodScore > 5) {
      return NextResponse.json({ error: "mood_score must be 1–5" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("daily_check_ins")
      .insert({
        user_id:        user.id,
        status,
        mood_score:     moodScore,
        support_needed: Boolean(body.support_needed),
        notes,
        points_awarded: 10,
      })
      .select()
      .single();

    if (error) {
      const isDuplicate = error.message.includes("daily_check_ins_user_day_unique");
      return NextResponse.json(
        { error: isDuplicate ? "Already checked in today" : error.message },
        { status: isDuplicate ? 409 : 500 }
      );
    }
    return NextResponse.json({ checkin: data }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
