import { createClient, isSupabaseConfigured, SUPABASE_NOT_CONFIGURED } from "@/lib/supabase-server";
import type { CommunityPost } from "@/types";

// Community writes go through the RLS-scoped client; the policies in
// schema.sql enforce that author_id must equal the signed-in user.

export const CommunityModel = {
  async list(): Promise<CommunityPost[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = createClient();
    const { data, error } = await supabase
      .from("community_posts")
      .select("id, title, body, created_at, author_id, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as CommunityPost[];
  },

  async get(id: string): Promise<CommunityPost | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("community_posts")
      .select("id, title, body, created_at, author_id, profiles(full_name)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as unknown as CommunityPost | null;
  },

  async create(authorId: string, title: string, body: string): Promise<CommunityPost> {
    if (!isSupabaseConfigured()) throw new Error(SUPABASE_NOT_CONFIGURED);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("community_posts")
      .insert({ author_id: authorId, title, body })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as CommunityPost;
  },

  async update(id: string, patch: { title?: string; body?: string }): Promise<CommunityPost> {
    if (!isSupabaseConfigured()) throw new Error(SUPABASE_NOT_CONFIGURED);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("community_posts")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as CommunityPost;
  },

  async remove(id: string): Promise<void> {
    if (!isSupabaseConfigured()) throw new Error(SUPABASE_NOT_CONFIGURED);
    const supabase = createClient();
    const { error } = await supabase.from("community_posts").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
