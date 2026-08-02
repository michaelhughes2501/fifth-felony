import {
  createClient,
  createServiceClient,
  isSupabaseConfigured,
  SUPABASE_NOT_CONFIGURED,
} from "@/lib/supabase-server";
import type { LegalResource } from "@/types";

// Escape PostgREST special characters to prevent filter injection.
function sanitizeFilter(value: string): string {
  return value.replace(/[.,()\\%]/g, "");
}

export const LegalModel = {
  async list(q?: string): Promise<LegalResource[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = createClient();
    let query = supabase.from("legal_resources").select("*").order("created_at", { ascending: false });
    if (q) {
      const safe = sanitizeFilter(q);
      query = query.or(`name.ilike.%${safe}%,category.ilike.%${safe}%,location.ilike.%${safe}%`);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as LegalResource[];
  },
  async get(id: string): Promise<LegalResource | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = createClient();
    const { data, error } = await supabase.from("legal_resources").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data as LegalResource | null;
  },
  async create(input: Partial<LegalResource>): Promise<LegalResource> {
    if (!isSupabaseConfigured()) throw new Error(SUPABASE_NOT_CONFIGURED);
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("legal_resources").insert(input).select().single();
    if (error) throw new Error(error.message);
    return data as LegalResource;
  },
  async update(id: string, patch: Partial<LegalResource>): Promise<LegalResource> {
    if (!isSupabaseConfigured()) throw new Error(SUPABASE_NOT_CONFIGURED);
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("legal_resources").update(patch).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data as LegalResource;
  },
  async remove(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error(SUPABASE_NOT_CONFIGURED);
    const supabase = createServiceClient();
    const { error } = await supabase.from("legal_resources").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
