import { CommunityModel } from "@/models/community.model";
import { createClient } from "@/lib/supabase-server";
import type { CommunityPost, Result } from "@/types";

export const CommunityController = {
  async list(): Promise<Result<CommunityPost[]>> {
    try {
      return { ok: true, data: await CommunityModel.list() };
    } catch (e: any) {
      return { ok: false, error: e.message, status: 500 };
    }
  },

  async create(title: string, body: string): Promise<Result<CommunityPost>> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sign in required", status: 401 };
    if (!title?.trim() || !body?.trim())
      return { ok: false, error: "Title and body are required", status: 400 };
    try {
      const post = await CommunityModel.create(user.id, title.trim(), body.trim());
      return { ok: true, data: post };
    } catch (e: any) {
      return { ok: false, error: e.message, status: 500 };
    }
  },

  async update(id: string, patch: { title?: string; body?: string }): Promise<Result<CommunityPost>> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sign in required", status: 401 };
    try {
      // RLS guarantees only the author can update; surface 403 if it changed nothing.
      return { ok: true, data: await CommunityModel.update(id, patch) };
    } catch (e: any) {
      return { ok: false, error: e.message, status: 500 };
    }
  },

  async remove(id: string): Promise<Result<{ id: string }>> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sign in required", status: 401 };
    try {
      await CommunityModel.remove(id);
      return { ok: true, data: { id } };
    } catch (e: any) {
      return { ok: false, error: e.message, status: 500 };
    }
  },
};
