import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const uuidSchema = z.string().uuid();

export function safeSearchTerm(value: string | undefined): string | undefined {
  const term = value?.replace(/[,.()\\%_*]/g, " ").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
  return term || undefined;
}

export const housingInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.enum(["transitional", "rental", "halfway", "shelter"]).nullable().optional(),
  location: optionalText(200),
  description: optionalText(10000),
  contact: optionalText(500),
}).strict();

export const legalInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: optionalText(100),
  location: optionalText(200),
  description: optionalText(10000),
  contact: optionalText(500),
}).strict();

export const communityPostInputSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  body: z.string().trim().min(1).max(10000).optional(),
}).strict().refine((value) => value.title !== undefined || value.body !== undefined);

export const communityCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
}).strict();

export const communityReplySchema = z.object({
  body: z.string().trim().min(1).max(5000),
}).strict();

export const applicationCreateSchema = z.object({ job_id: uuidSchema }).strict();
export const jobInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(200),
  location: optionalText(200),
  description: optionalText(10000),
  fair_chance: z.boolean().optional(),
  apply_url: z.string().url().max(2000).nullable().optional(),
}).strict();
export const applicationStatusSchema = z.object({
  status: z.enum(["interested", "applied", "interviewing", "hired", "closed"]),
}).strict();

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T | null> {
  try {
    const value: unknown = await request.json();
    const result = schema.safeParse(value);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
