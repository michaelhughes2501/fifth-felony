import { CaseModel } from "@/models/case.model";
import { createClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { ensureProfile, isDatabaseConfigured, DATABASE_NOT_CONFIGURED } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import type { LegalCaseInput } from "@/lib/request-validation";
import type { LegalCase, Result } from "@/types";

async function requireUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) { try { await ensureProfile(user.id, user.user_metadata?.full_name ?? null); } catch { /* request operation handles database failure */ } }
  return user;
}

const SIGN_IN = { ok: false as const, error: "Sign in required", status: 401 };
const NO_DB = { ok: false as const, error: DATABASE_NOT_CONFIGURED, status: 503 };
const writeAllowed = (userId: string) => checkRateLimit(`case:${userId}`, 30, 60 * 60 * 1000);

export const CaseController = {
  async listMine(): Promise<Result<LegalCase[]>> {
    const user = await requireUser();
    if (!user) return SIGN_IN;
    if (!isDatabaseConfigured()) return NO_DB;
    try { return { ok: true, data: await CaseModel.listForUser(user.id) }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async create(input: LegalCaseInput): Promise<Result<LegalCase>> {
    const user = await requireUser();
    if (!user) return SIGN_IN;
    if (!isDatabaseConfigured()) return NO_DB;
    if (!writeAllowed(user.id)) return { ok: false, error: "Too many case updates. Try again later.", status: 429 };
    try { return { ok: true, data: await CaseModel.create(user.id, input) }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async update(id: string, input: LegalCaseInput): Promise<Result<LegalCase>> {
    const user = await requireUser();
    if (!user) return SIGN_IN;
    if (!isDatabaseConfigured()) return NO_DB;
    if (!writeAllowed(user.id)) return { ok: false, error: "Too many case updates. Try again later.", status: 429 };
    try {
      const row = await CaseModel.update(id, user.id, input);
      return row ? { ok: true, data: row } : { ok: false, error: "Case not found", status: 404 };
    } catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async remove(id: string): Promise<Result<{ id: string }>> {
    const user = await requireUser();
    if (!user) return SIGN_IN;
    if (!isDatabaseConfigured()) return NO_DB;
    try {
      return (await CaseModel.remove(id, user.id)) ? { ok: true, data: { id } } : { ok: false, error: "Case not found", status: 404 };
    } catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
};
