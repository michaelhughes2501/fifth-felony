// Role-based access control helpers.
//
// Role model (low -> high): resident, moderator, admin, super_admin.
// Legacy rows may still carry 'member' / 'provider' — these map to
// resident / moderator respectively so existing accounts keep working.
//
// Everything here is pure / edge-safe EXCEPT getSessionRole/requireRole,
// which build a server Supabase client. Importing the pure helpers from
// middleware (edge runtime) is fine.

import { createClient } from "@/lib/supabase-server";

export type Role = "resident" | "moderator" | "admin" | "super_admin";

// Includes legacy aliases so DB values map onto a numeric level.
export const ROLE_LEVELS: Record<string, number> = {
  member: 1,
  resident: 1,
  provider: 2,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

export function roleLevel(role: string | null | undefined): number {
  if (!role) return 0;
  return ROLE_LEVELS[role] ?? 0;
}

export function roleAtLeast(role: string | null | undefined, min: Role): boolean {
  return roleLevel(role) >= roleLevel(min);
}

export function normalizeRole(role: string | null | undefined): Role {
  switch (role) {
    case "super_admin":
      return "super_admin";
    case "admin":
      return "admin";
    case "moderator":
    case "provider":
      return "moderator";
    case "resident":
    case "member":
    default:
      return "resident";
  }
}

type SupabaseServerClient = ReturnType<typeof createClient>;

// Resolve the current user and their (normalized) role from a server client.
// Never throws — defaults to an anonymous resident on any failure.
export async function getSessionRole(
  supabase: SupabaseServerClient
): Promise<{ userId: string | null; role: Role }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { userId: null, role: "resident" };

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return { userId: user.id, role: normalizeRole(data?.role) };
  } catch {
    return { userId: null, role: "resident" };
  }
}

// Guard for the top of a protected API route. Builds its own server client.
export async function requireRole(
  min: Role
): Promise<
  | { ok: true; userId: string; role: Role }
  | { ok: false; status: number; error: string }
> {
  const supabase = createClient();
  const { userId, role } = await getSessionRole(supabase);
  if (!userId) return { ok: false, status: 401, error: "Authentication required." };
  if (!roleAtLeast(role, min))
    return { ok: false, status: 403, error: "Insufficient permissions." };
  return { ok: true, userId, role };
}
