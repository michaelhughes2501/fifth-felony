import { describe, expect, it } from "vitest";
import {
  applicationCreateSchema,
  applicationStatusSchema,
  communityCreateSchema,
  communityReplySchema,
  housingInputSchema,
  jobInputSchema,
  legalInputSchema,
  safeSearchTerm,
} from "./request-validation";

describe("request boundary schemas", () => {
  it("accepts only UUID application job references", () => {
    expect(applicationCreateSchema.safeParse({ job_id: "not-a-uuid" }).success).toBe(false);
    expect(applicationCreateSchema.safeParse({ job_id: "00000000-0000-4000-8000-000000000001" }).success).toBe(true);
  });

  it("rejects invalid application statuses and injected fields", () => {
    expect(applicationStatusSchema.safeParse({ status: "admin" }).success).toBe(false);
    expect(applicationStatusSchema.safeParse({ status: "applied", user_id: "other-user" }).success).toBe(false);
  });

  it("requires bounded, nonempty domain fields and rejects server-owned columns", () => {
    expect(housingInputSchema.safeParse({ name: " ", id: "owned" }).success).toBe(false);
    expect(housingInputSchema.safeParse({ name: "Home", created_at: "yesterday" }).success).toBe(false);
    expect(legalInputSchema.safeParse({ name: "Legal aid", extra: true }).success).toBe(false);
    expect(jobInputSchema.safeParse({ title: "Role", company: "Org", fair_chance: "yes" }).success).toBe(false);
  });

  it("bounds community post and reply content", () => {
    expect(communityCreateSchema.safeParse({ title: "Hi", body: "There" }).success).toBe(true);
    expect(communityReplySchema.safeParse({ body: " ".repeat(20) }).success).toBe(false);
    expect(communityReplySchema.safeParse({ body: "x".repeat(5001) }).success).toBe(false);
  });

  it("strips PostgREST filter syntax from search terms", () => {
    expect(safeSearchTerm("safe,(or),term.*%_")).toBe("safe or term");
    expect(safeSearchTerm("   ")).toBeUndefined();
  });
});
