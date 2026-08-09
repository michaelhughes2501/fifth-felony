import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isPlaceholder = (value: string): boolean =>
  !value || /placeholder|REPLACE|your-project/i.test(value);

export function isSupabaseConfigured(): boolean {
  return !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);
}

export const SUPABASE_NOT_CONFIGURED =
  "Supabase is not configured. Add real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the deployment environment.";

export function createClient() {
  return createServerClient(supabaseUrl || "http://127.0.0.1:54321", supabaseAnonKey || "local-placeholder-anon-key", {
    cookies: {
      async getAll() {
        const cookieStore = await cookies();
        return cookieStore.getAll();
      },
      async setAll(cookiesToSet: CookieToSet[]) {
        try {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot always mutate cookies; middleware handles refresh.
        }
      },
    },
  });
}

export function createServiceClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey || isPlaceholder(supabaseServiceRoleKey)) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for service-role operations.");
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
