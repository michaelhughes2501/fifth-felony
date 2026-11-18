import { NextRequest, NextResponse } from "next/server";
import { ResidentDashboardController } from "@/controllers/resident-dashboard.controller";
import { createClient } from "@/lib/supabase-server";
import { query, queryOne, ensureProfile } from "@/lib/db";
import { z } from "zod";
import type { DailyCheckIn } from "@/types";

const rollCallSchema = z.object({
  status: z.enum(["steady", "needs_support", "urgent"]),
  mood_score: z.number().int().min(1).max(5),
  support_needed: z.boolean().optional(),
  notes: z.string().trim().max(1200).nullable().optional(),
}).strict();

export async function GET() {
  const auth = createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  try { await ensureProfile(user.id, user.user_metadata?.full_name ?? null); }
  catch { return NextResponse.json({ error: "Could not initialize profile" }, { status: 500 }); }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  try {
    const [today, history] = await Promise.all([
      queryOne<DailyCheckIn>("SELECT * FROM daily_check_ins WHERE user_id=$1 AND created_at >= $2 ORDER BY created_at DESC LIMIT 1", [user.id, start.toISOString()]),
      query<DailyCheckIn>("SELECT id,status,mood_score,points_awarded,created_at FROM daily_check_ins WHERE user_id=$1 ORDER BY created_at DESC LIMIT 14", [user.id]),
    ]);
    return NextResponse.json({ today, history });
  } catch {
    return NextResponse.json({ error: "Could not load roll call" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  try { await ensureProfile(user.id, user.user_metadata?.full_name ?? null); }
  catch { return NextResponse.json({ error: "Could not initialize profile" }, { status: 500 }); }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const parsed = rollCallSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid roll call payload" }, { status: 400 });
  const result = await ResidentDashboardController.createCheckIn(parsed.data);
  return result.ok
    ? NextResponse.json({ check_in: result.data }, { status: 201 })
    : NextResponse.json({ error: result.error }, { status: result.status });
}
