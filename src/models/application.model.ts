import { createClient } from "@/lib/supabase-server";
import type { JobApplication } from "@/types";

// Owner-scoped via RLS: every query runs as the signed-in user.
export const ApplicationModel = {
  async listForUser(userId: string): Promise<JobApplication[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("job_applications")
      .select("*, jobs(title, company, location, apply_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as JobApplication[];
  },
  async countForUser(userId: string): Promise<number> {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("job_applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
  async create(userId: string, jobId: string): Promise<JobApplication> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("job_applications")
      .insert({ user_id: userId, job_id: jobId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as JobApplication;
  },
  async updateStatus(id: string, status: JobApplication["status"]): Promise<JobApplication> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("job_applications")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as JobApplication;
  },
  async remove(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("job_applications").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
