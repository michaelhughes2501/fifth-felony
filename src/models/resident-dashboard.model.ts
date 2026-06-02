import { createClient } from "@/lib/supabase-server";
import type {
  CheckInStatus,
  DailyCheckIn,
  DashboardSummary,
  PositiveBehaviorEvent,
  SupervisionAssignment,
} from "@/types";

const CHECK_IN_POINTS = 10;

function tierFromPoints(total: number) {
  if (total >= 600) return 5;
  if (total >= 350) return 4;
  if (total >= 175) return 3;
  if (total >= 60) return 2;
  return 1;
}

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeekIso() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function calculateStreak(entries: DailyCheckIn[]) {
  if (entries.length === 0) return 0;
  const days = new Set(entries.map((entry) => entry.created_at.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 60; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export const ResidentDashboardModel = {
  async getSummary(userId: string): Promise<DashboardSummary> {
    const supabase = createClient();
    const today = startOfTodayIso();
    const week = startOfWeekIso();

    const [todayCheckIn, allEvents, weekEvents, recentEvents, recentCheckIns, supervision] =
      await Promise.all([
        supabase
          .from("daily_check_ins")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", today)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("positive_behavior_events").select("points").eq("user_id", userId),
        supabase
          .from("positive_behavior_events")
          .select("points")
          .eq("user_id", userId)
          .gte("created_at", week),
        supabase
          .from("positive_behavior_events")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("daily_check_ins")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(60),
        supabase
          .from("supervision_assignments")
          .select("*")
          .eq("participant_id", userId)
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const firstError = [
      todayCheckIn.error,
      allEvents.error,
      weekEvents.error,
      recentEvents.error,
      recentCheckIns.error,
      supervision.error,
    ].find(Boolean);
    if (firstError) throw new Error(firstError.message);

    const total = (allEvents.data ?? []).reduce((sum, row) => sum + (row.points ?? 0), 0);
    const thisWeek = (weekEvents.data ?? []).reduce((sum, row) => sum + (row.points ?? 0), 0);

    return {
      todayCheckIn: (todayCheckIn.data ?? null) as DailyCheckIn | null,
      goodTime: {
        total,
        thisWeek,
        streak: calculateStreak((recentCheckIns.data ?? []) as DailyCheckIn[]),
        tier: tierFromPoints(total),
      },
      supervision: (supervision.data ?? null) as SupervisionAssignment | null,
      recentEvents: (recentEvents.data ?? []) as PositiveBehaviorEvent[],
    };
  },

  async createCheckIn(
    userId: string,
    input: { status: CheckInStatus; mood_score: number; support_needed: boolean; notes?: string | null }
  ): Promise<DailyCheckIn> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("daily_check_ins")
      .insert({
        user_id: userId,
        status: input.status,
        mood_score: input.mood_score,
        support_needed: input.support_needed,
        notes: input.notes || null,
        points_awarded: CHECK_IN_POINTS,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const checkIn = data as DailyCheckIn;
    const { error: eventError } = await supabase.from("positive_behavior_events").insert({
      user_id: userId,
      event_type: "daily_check_in",
      points: CHECK_IN_POINTS,
      source_id: checkIn.id,
      note: "Completed daily status confirmation",
    });
    if (eventError) throw new Error(eventError.message);

    return checkIn;
  },
};
