import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().trim().min(1).max(10_000),
}).strict();

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
  conversationId: z.string().uuid().optional(),
  stream: z.boolean().optional(),
}).strict();

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const housingInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.enum(["transitional", "rental", "halfway", "shelter"]).nullable().optional(),
  location: optionalText(200),
  description: optionalText(10_000),
  contact: optionalText(500),
}).strict();

export const legalInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: optionalText(100),
  location: optionalText(200),
  description: optionalText(10_000),
  contact: optionalText(500),
}).strict();

export const housingPatchSchema = housingInputSchema.partial().strict().refine((value) => Object.keys(value).length > 0);
export const legalPatchSchema = legalInputSchema.partial().strict().refine((value) => Object.keys(value).length > 0);

export const communityCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10_000),
}).strict();
export const communityPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  body: z.string().trim().min(1).max(10_000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0);
export const communityReplySchema = z.object({ body: z.string().trim().min(1).max(5_000) }).strict();
export const applicationStatusSchema = z.object({
  status: z.enum(["interested", "applied", "interviewing", "hired", "closed"]),
}).strict();

export const createApplicationSchema = z.object({ job_id: z.string().uuid() }).strict();

const nullableTrimmedString = (max: number) => z.string().trim().max(max).nullable().optional();
export const createJobSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(200),
  location: nullableTrimmedString(200),
  description: nullableTrimmedString(10_000),
  fair_chance: z.boolean().optional().default(false),
  apply_url: z.string().trim().url().max(2_000).nullable().optional(),
}).strict();

export const updateJobSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  company: z.string().trim().min(1).max(200).optional(),
  location: nullableTrimmedString(200),
  description: nullableTrimmedString(10_000),
  fair_chance: z.boolean().optional(),
  apply_url: z.string().trim().url().max(2_000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);
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

const caseText = (max: number) =>
  z.string().trim().max(max).transform((v) => v.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
export const legalCaseInputSchema = z.object({
  case_number: caseText(60).pipe(z.string().min(1)),
  court: caseText(120).pipe(z.string().min(1)),
  case_type: z.enum(["criminal", "probation_parole", "expungement", "family", "civil", "other"]).default("criminal"),
  status: z.enum(["open", "pending_hearing", "on_supervision", "closed", "dismissed"]).default("open"),
  next_hearing_at: z.string().datetime({ offset: true }).nullable().optional(),
  attorney: caseText(120).nullable().optional(),
  notes: z.string().trim().max(2_000).transform((v) => v.replace(/<[^>]*>/g, "").trim()).nullable().optional(),
}).strict();
export type LegalCaseInput = z.infer<typeof legalCaseInputSchema>;
