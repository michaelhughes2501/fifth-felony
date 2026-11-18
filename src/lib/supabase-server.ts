// Server-side auth facade. Kept so existing controllers keep their call shape; the
// implementation is Neon Auth (see src/lib/neon-auth.ts).
import { getCurrentUser, isNeonAuthConfigured, NEON_AUTH_NOT_CONFIGURED } from "@/lib/neon-auth";

export const isSupabaseConfigured = isNeonAuthConfigured;
export const SUPABASE_NOT_CONFIGURED = NEON_AUTH_NOT_CONFIGURED;

export function createClient() {
  return {
    auth: {
      async getUser() {
        try {
          const user = await getCurrentUser();
          return { data: { user }, error: null };
        } catch (error) {
          return { data: { user: null }, error };
        }
      },
    },
  };
}
