import { createClient, createServiceClient } from "@/lib/supabase-server";
import type { LegalResource } from "@/types";

export const LegalModel = {
  async list(q?: string): Promise<LegalResource[]> {
    const supabase = createClient();
    let query = supabase.from("legal_resources").select("*").order("created_at", { ascending: false });
    if (q) query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%,location.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as LegalResource[];
  },
  async get(id: string): Promise<LegalResource | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from("legal_resources").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data as LegalResource | null;
  },
  async create(input: Partial<LegalResource>): Promise<LegalResource> {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("legal_resources").insert(input).select().single();
    if (error) throw new Error(error.message);
    return data as LegalResource;
  },
  async update(id: string, patch: Partial<LegalResource>): Promise<LegalResource> {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("legal_resources").update(patch).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data as LegalResource;
  },
  async remove(id: string): Promise<void> {
    const supabase = createServiceClient();
    const { error } = await supabase.from("legal_resources").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
