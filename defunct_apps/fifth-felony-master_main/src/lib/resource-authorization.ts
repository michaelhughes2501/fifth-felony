import "server-only";
import { createClient } from "@/lib/supabase-server";

export async function canManageResources(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return false;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return !error && (profile?.role === "admin" || profile?.role === "provider");
}
