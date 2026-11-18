import { describe, expect, it } from "vitest";
import {
  applicationStatusSchema,
  communityCreateSchema,
  communityPatchSchema,
  createApplicationSchema,
  housingInputSchema,
  housingPatchSchema,
  legalInputSchema,
  legalPatchSchema,
  updateJobSchema,
} from "./request-validation";

describe("Neon API request schemas", () => {
  it("rejects client-owned fields on create payloads", () => {
    expect(housingInputSchema.safeParse({ name: "Home", id: "owned" }).success).toBe(false);
    expect(legalInputSchema.safeParse({ name: "Legal Aid", role: "admin" }).success).toBe(false);
    expect(createApplicationSchema.safeParse({ job_id: "00000000-0000-4000-8000-000000000001", user_id: "other" }).success).toBe(false);
  });

  it("requires valid, nonempty resource updates", () => {
    expect(housingPatchSchema.safeParse({}).success).toBe(false);
    expect(housingPatchSchema.safeParse({ type: "invalid" }).success).toBe(false);
    expect(legalPatchSchema.safeParse({ name: "Aid", extra: true }).success).toBe(false);
    expect(updateJobSchema.safeParse({}).success).toBe(false);
    expect(updateJobSchema.safeParse({ fair_chance: "yes" }).success).toBe(false);
  });

  it("rejects invalid status and spoofed community fields", () => {
    expect(applicationStatusSchema.safeParse({ status: "admin" }).success).toBe(false);
    expect(communityCreateSchema.safeParse({ title: "Hello", body: "There", author_id: "spoof" }).success).toBe(false);
    expect(communityPatchSchema.safeParse({ title: "" }).success).toBe(false);
  });
});
