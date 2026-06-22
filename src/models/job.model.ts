import {
  createClient,
  createServiceClient,
  isSupabaseConfigured,
  SUPABASE_NOT_CONFIGURED,
} from "@/lib/supabase-server";
import type { Job } from "@/types";

// MODEL: owns all data access for the `jobs` table.
// Read uses the RLS-scoped client; writes use the service client
// (admin/provider seeding) since public users can't write jobs.

export const JobModel = {
  async list(q?: string): Promise<Job[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = createClient();
    let query = supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (q) query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%,location.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Job[];
  },

  async get(id: string): Promise<Job | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = createClient();
    const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Job | null;
  },

  async create(input: Partial<Job>): Promise<Job> {
    if (!isSupabaseConfigured()) throw new Error(SUPABASE_NOT_CONFIGURED);
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("jobs").insert(input).select().single();
    if (error) throw new Error(error.message);
    return data as Job;
  },

  async update(id: string, patch: Partial<Job>): Promise<Job> {
    if (!isSupabaseConfigured()) throw new Error(SUPABASE_NOT_CONFIGURED);
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("jobs").update(patch).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data as Job;
  },

  async remove(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error(SUPABASE_NOT_CONFIGURED);
    const supabase = createServiceClient();
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
