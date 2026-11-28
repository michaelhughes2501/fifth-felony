import { LegalModel } from "@/models/legal.model";
import { requireRole } from "@/lib/rbac";
import type { LegalResource, Result } from "@/types";

export const LegalController = {
  async list(q?: string): Promise<Result<LegalResource[]>> {
    try {
      return { ok: true, data: await LegalModel.list(q) };
    } catch {
      return { ok: false, error: "Could not load legal resources.", status: 500 };
    }
  },
  async get(id: string): Promise<Result<LegalResource>> {
    try {
      const r = await LegalModel.get(id);
      if (!r) return { ok: false, error: "Resource not found", status: 404 };
      return { ok: true, data: r };
    } catch {
      return { ok: false, error: "Could not load legal resource.", status: 500 };
    }
  },
  async create(input: Partial<LegalResource>): Promise<Result<LegalResource>> {
    const auth = await requireRole("moderator");
    if (!auth.ok) return auth;
    if (!input.name?.trim()) return { ok: false, error: "Name is required", status: 400 };
    try {
      return { ok: true, data: await LegalModel.create(input) };
    } catch {
      return { ok: false, error: "Could not create legal resource.", status: 500 };
    }
  },
  async update(id: string, patch: Partial<LegalResource>): Promise<Result<LegalResource>> {
    const auth = await requireRole("moderator");
    if (!auth.ok) return auth;
    try {
      return { ok: true, data: await LegalModel.update(id, patch) };
    } catch {
      return { ok: false, error: "Could not update legal resource.", status: 500 };
    }
  },
  async remove(id: string): Promise<Result<{ id: string }>> {
    const auth = await requireRole("moderator");
    if (!auth.ok) return auth;
    try {
      await LegalModel.remove(id);
      return { ok: true, data: { id } };
    } catch {
      return { ok: false, error: "Could not delete legal resource.", status: 500 };
    }
  },
};
