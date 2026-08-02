import { HousingModel } from "@/models/housing.model";
import { requireRole } from "@/lib/rbac";
import type { Housing, Result } from "@/types";

export const HousingController = {
  async list(q?: string): Promise<Result<Housing[]>> {
    try { return { ok: true, data: await HousingModel.list(q) }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async get(id: string): Promise<Result<Housing>> {
    try {
      const h = await HousingModel.get(id);
      if (!h) return { ok: false, error: "Housing not found", status: 404 };
      return { ok: true, data: h };
    } catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async create(input: Partial<Housing>): Promise<Result<Housing>> {
    const auth = await requireRole("admin");
    if (!auth.ok) return auth;
    if (!input.name?.trim()) return { ok: false, error: "Name is required", status: 400 };
    try { return { ok: true, data: await HousingModel.create(input) }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async update(id: string, patch: Partial<Housing>): Promise<Result<Housing>> {
    const auth = await requireRole("admin");
    if (!auth.ok) return auth;
    try { return { ok: true, data: await HousingModel.update(id, patch) }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async remove(id: string): Promise<Result<{ id: string }>> {
    const auth = await requireRole("admin");
    if (!auth.ok) return auth;
    try { await HousingModel.remove(id); return { ok: true, data: { id } }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
};
