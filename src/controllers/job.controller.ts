import { JobModel } from "@/models/job.model";
import { requireRole } from "@/lib/rbac";
import type { Job, Result } from "@/types";

export const JobController = {
  async list(q?: string): Promise<Result<Job[]>> {
    try {
      return { ok: true, data: await JobModel.list(q) };
    } catch {
      return { ok: false, error: "Could not load jobs.", status: 500 };
    }
  },

  async get(id: string): Promise<Result<Job>> {
    try {
      const job = await JobModel.get(id);
      if (!job) return { ok: false, error: "Job not found", status: 404 };
      return { ok: true, data: job };
    } catch {
      return { ok: false, error: "Could not load job.", status: 500 };
    }
  },

  async create(input: Partial<Job>): Promise<Result<Job>> {
    const auth = await requireRole("moderator");
    if (!auth.ok) return auth;
    if (!input.title?.trim() || !input.company?.trim())
      return { ok: false, error: "Title and company are required", status: 400 };
    try {
      return { ok: true, data: await JobModel.create(input) };
    } catch {
      return { ok: false, error: "Could not create job.", status: 500 };
    }
  },

  async update(id: string, patch: Partial<Job>): Promise<Result<Job>> {
    const auth = await requireRole("moderator");
    if (!auth.ok) return auth;
    try {
      return { ok: true, data: await JobModel.update(id, patch) };
    } catch {
      return { ok: false, error: "Could not update job.", status: 500 };
    }
  },

  async remove(id: string): Promise<Result<{ id: string }>> {
    const auth = await requireRole("moderator");
    if (!auth.ok) return auth;
    try {
      await JobModel.remove(id);
      return { ok: true, data: { id } };
    } catch {
      return { ok: false, error: "Could not delete job.", status: 500 };
    }
  },
};
