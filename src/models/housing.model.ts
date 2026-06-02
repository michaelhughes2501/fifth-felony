import { createClient, createServiceClient } from "@/lib/supabase-server";
import type { Housing } from "@/types";

export const HousingModel = {
  async list(q?: string): Promise<Housing[]> {
    const supabase = createClient();
    let query = supabase.from("housing").select("*").order("created_at", { ascending: false });
    if (q) query = query.or(`name.ilike.%${q}%,location.ilike.%${q}%,type.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Housing[];
  },
  async get(id: string): Promise<Housing | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from("housing").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data as Housing | null;
  },
  async create(input: Partial<Housing>): Promise<Housing> {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("housing").insert(input).select().single();
    if (error) throw new Error(error.message);
    return data as Housing;
  },
  async update(id: string, patch: Partial<Housing>): Promise<Housing> {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("housing").update(patch).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data as Housing;
  },
  async remove(id: string): Promise<void> {
    const supabase = createServiceClient();
    const { error } = await supabase.from("housing").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
