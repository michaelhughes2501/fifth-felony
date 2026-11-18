import { LegalModel } from "@/models/legal.model";
import type { LegalResource, Result } from "@/types";

export const LegalController = {
  async list(q?: string): Promise<Result<LegalResource[]>> {
    try { return { ok: true, data: await LegalModel.list(q) }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async get(id: string): Promise<Result<LegalResource>> {
    try {
      const r = await LegalModel.get(id);
      if (!r) return { ok: false, error: "Resource not found", status: 404 };
      return { ok: true, data: r };
    } catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async create(input: Partial<LegalResource>): Promise<Result<LegalResource>> {
    if (!input.name?.trim()) return { ok: false, error: "Name is required", status: 400 };
    try { return { ok: true, data: await LegalModel.create(input) }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async update(id: string, patch: Partial<LegalResource>): Promise<Result<LegalResource>> {
    try { return { ok: true, data: await LegalModel.update(id, patch) }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
  async remove(id: string): Promise<Result<{ id: string }>> {
    try { await LegalModel.remove(id); return { ok: true, data: { id } }; }
    catch (e: any) { return { ok: false, error: e.message, status: 500 }; }
  },
};
