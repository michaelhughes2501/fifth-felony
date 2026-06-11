import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/profile?id=<uuid>  — fetch a profile by user id
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("id");
  if (!userId) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, city, bio, goals, role, created_at")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/profile  — update own profile (must be signed in)
export async function PUT(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const body: Record<string, unknown> = await req.json().catch(() => ({}));
    // Whitelist updatable fields; never allow id or role to be changed here
    const { full_name, city, bio, goals } = body as {
      full_name?: string; city?: string; bio?: string; goals?: string;
    };

    const patch: Record<string, unknown> = {};
    if (full_name !== undefined) patch.full_name = String(full_name).trim().slice(0, 200);
    if (city      !== undefined) patch.city      = String(city).trim().slice(0, 100);
    if (bio       !== undefined) patch.bio       = String(bio).trim().slice(0, 1000);
    if (goals     !== undefined) patch.goals     = String(goals).trim().slice(0, 1000);

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select("id, full_name, city, bio, goals, role, created_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
