import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().trim().min(1).max(10_000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
  conversationId: z.string().uuid().optional(),
  stream: z.boolean().optional(),
});

export const createApplicationSchema = z.object({
  job_id: z.string().uuid(),
});

const nullableTrimmedString = (max: number) =>
  z.string().trim().max(max).nullable().optional();

export const createJobSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(200),
  location: nullableTrimmedString(200),
  description: nullableTrimmedString(10_000),
  fair_chance: z.boolean().optional().default(false),
  apply_url: z.string().trim().url().max(2_000).nullable().optional(),
});

export const updateJobSchema = createJobSchema.partial();

export const uuidParamSchema = z.string().uuid();

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type CreateApplicationRequest = z.infer<typeof createApplicationSchema>;
export type CreateJobRequest = z.infer<typeof createJobSchema>;
export type UpdateJobRequest = z.infer<typeof updateJobSchema>;

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
