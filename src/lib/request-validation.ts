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

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type CreateApplicationRequest = z.infer<typeof createApplicationSchema>;

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
