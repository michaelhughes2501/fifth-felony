import { JobModel } from "@/models/job.model";
import type { Job, Result } from "@/types";

// CONTROLLER: business logic + validation. Returns Result<T> so routes
// stay thin and never need try/catch around model calls themselves.

export const JobController = {
  async list(q?: string): Promise<Result<Job[]>> {
    try {
      return { ok: true, data: await JobModel.list(q) };
    } catch (e: any) {
      return { ok: false, error: e.message, status: 500 };
    }
  },

  async get(id: string): Promise<Result<Job>> {
    try {
      const job = await JobModel.get(id);
      if (!job) return { ok: false, error: "Job not found", status: 404 };
      return { ok: true, data: job };
    } catch (e: any) {
      return { ok: false, error: e.message, status: 500 };
    }
  },

  async create(input: Partial<Job>): Promise<Result<Job>> {
    if (!input.title?.trim() || !input.company?.trim())
      return { ok: false, error: "Title and company are required", status: 400 };
    try {
      return { ok: true, data: await JobModel.create(input) };
    } catch (e: any) {
      return { ok: false, error: e.message, status: 500 };
    }
  },

  async update(id: string, patch: Partial<Job>): Promise<Result<Job>> {
    try {
      return { ok: true, data: await JobModel.update(id, patch) };
    } catch (e: any) {
      return { ok: false, error: e.message, status: 500 };
    }
  },

  async remove(id: string): Promise<Result<{ id: string }>> {
    try {
      await JobModel.remove(id);
      return { ok: true, data: { id } };
    } catch (e: any) {
      return { ok: false, error: e.message, status: 500 };
    }
  },
};
