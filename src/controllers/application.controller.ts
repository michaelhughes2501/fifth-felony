import { ApplicationModel } from "@/models/application.model";
import { createClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { JobApplication, Result } from "@/types";

async function requireUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export const ApplicationController = {
  async listMine(): Promise<Result<JobApplication[]>> {
    const user = await requireUser();
    if (!user) return { ok: false, error: "Sign in required", status: 401 };
    try { return { ok: true, data: await ApplicationModel.listForUser(user.id) }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async countMine(): Promise<number> {
    const user = await requireUser();
    if (!user) return 0;
    try { return await ApplicationModel.countForUser(user.id); } catch { return 0; }
  },
  async create(jobId: string): Promise<Result<JobApplication>> {
    const user = await requireUser();
    if (!user) return { ok: false, error: "Sign in required", status: 401 };
    if (!jobId) return { ok: false, error: "job_id required", status: 400 };
    try { return { ok: true, data: await ApplicationModel.create(user.id, jobId) }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async updateStatus(id: string, status: JobApplication["status"]): Promise<Result<JobApplication>> {
    const user = await requireUser();
    if (!user) return { ok: false, error: "Sign in required", status: 401 };
    try { return { ok: true, data: await ApplicationModel.updateStatus(id, status) }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async remove(id: string): Promise<Result<{ id: string }>> {
    const user = await requireUser();
    if (!user) return { ok: false, error: "Sign in required", status: 401 };
    try { await ApplicationModel.remove(id); return { ok: true, data: { id } }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
};
