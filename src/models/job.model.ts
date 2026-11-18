import { query, queryOne, DATABASE_NOT_CONFIGURED, isDatabaseConfigured } from "@/lib/db";
import type { Job } from "@/types";

const EDITABLE_FIELDS = ["title", "company", "location", "description", "fair_chance", "apply_url"] as const;

export const JobModel = {
  async list(q?: string): Promise<Job[]> {
    if (!isDatabaseConfigured()) return [];
    if (!q) return query<Job>("SELECT * FROM jobs ORDER BY created_at DESC");
    const search = `%${q}%`;
    return query<Job>("SELECT * FROM jobs WHERE title ILIKE $1 OR company ILIKE $1 OR location ILIKE $1 ORDER BY created_at DESC", [search]);
  },
  async get(id: string): Promise<Job | null> {
    if (!isDatabaseConfigured()) return null;
    return queryOne<Job>("SELECT * FROM jobs WHERE id = $1", [id]);
  },
  async create(input: Partial<Job>): Promise<Job> {
    if (!isDatabaseConfigured()) throw new Error(DATABASE_NOT_CONFIGURED);
    const row = await queryOne<Job>("INSERT INTO jobs (title, company, location, description, fair_chance, apply_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *", [input.title, input.company, input.location ?? null, input.description ?? null, input.fair_chance ?? true, input.apply_url ?? null]);
    if (!row) throw new Error("Could not create job.");
    return row;
  },
  async update(id: string, patch: Partial<Job>): Promise<Job> {
    if (!isDatabaseConfigured()) throw new Error(DATABASE_NOT_CONFIGURED);
    const fields = EDITABLE_FIELDS.filter((key) => patch[key] !== undefined);
    if (!fields.length) throw new Error("No fields to update.");
    const assignments = fields.map((key, index) => `${key} = $${index + 2}`).join(", ");
    const row = await queryOne<Job>(`UPDATE jobs SET ${assignments} WHERE id = $1 RETURNING *`, [id, ...fields.map((key) => patch[key])]);
    if (!row) throw new Error("Job not found.");
    return row;
  },
  async remove(id: string): Promise<void> {
    if (!isDatabaseConfigured()) throw new Error(DATABASE_NOT_CONFIGURED);
    await query("DELETE FROM jobs WHERE id = $1", [id]);
  },
};
