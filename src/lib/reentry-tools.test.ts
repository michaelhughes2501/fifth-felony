import { describe, expect, it } from "vitest";
import {
  calculateBudget,
  calculateReadinessScore,
  calculateSentence,
  evaluateExpungement,
} from "./reentry-tools";

const budgetBase = {
  monthlyIncome: 0,
  benefitsIncome: 0,
  rentExpense: 0,
  foodExpense: 0,
  transitExpense: 0,
  phoneExpense: 0,
  courtFeesAndRestitution: 0,
  otherExpenses: 0,
};

describe("calculateBudget", () => {
  it("computes net cashflow and surplus", () => {
    const r = calculateBudget({ ...budgetBase, monthlyIncome: 2500, benefitsIncome: 300, rentExpense: 900, foodExpense: 300, transitExpense: 100, phoneExpense: 50, courtFeesAndRestitution: 150 });
    expect(r.totalIncome).toBe(2800);
    expect(r.totalExpenses).toBe(1500);
    expect(r.mandatoryLegalCosts).toBe(150);
    expect(r.netCashflow).toBe(1300);
    expect(r.isDeficit).toBe(false);
    expect(r.savingsRatePercent).toBe(46);
  });

  it("detects a deficit and points to assistance programs", () => {
    const r = calculateBudget({ ...budgetBase, monthlyIncome: 1000, rentExpense: 900, foodExpense: 300 });
    expect(r.isDeficit).toBe(true);
    expect(r.savingsRatePercent).toBe(0);
    expect(r.recommendation).toMatch(/SNAP/);
  });

  it("ignores negative and non-finite values", () => {
    const r = calculateBudget({ ...budgetBase, monthlyIncome: 1000, rentExpense: -500, foodExpense: Number.NaN });
    expect(r.totalExpenses).toBe(0);
  });
});

describe("evaluateExpungement", () => {
  const base = { yearsSinceCompletion: 3, restitutionPaidInFull: true, hasSubsequentArrests: false };

  it("marks a misdemeanor past the wait period as likely eligible", () => {
    expect(evaluateExpungement({ ...base, offenseType: "misdemeanor" }).status).toBe("likely_eligible");
  });

  it("flags unpaid restitution as a conditional blocker", () => {
    expect(evaluateExpungement({ ...base, offenseType: "misdemeanor", restitutionPaidInFull: false }).status).toBe("conditionally_eligible");
  });

  it("reports violent felonies and federal offenses as ineligible", () => {
    expect(evaluateExpungement({ ...base, offenseType: "violent-felony" }).status).toBe("ineligible");
    expect(evaluateExpungement({ ...base, offenseType: "federal" }).status).toBe("ineligible");
  });

  it("pauses eligibility on subsequent arrests or an unmet wait", () => {
    expect(evaluateExpungement({ ...base, offenseType: "infraction", hasSubsequentArrests: true }).status).toBe("ineligible_at_this_time");
    const early = evaluateExpungement({ ...base, offenseType: "non-violent-felony", yearsSinceCompletion: 1 });
    expect(early.status).toBe("ineligible_at_this_time");
    expect(early.requiredWaitYears).toBe(3);
  });
});

describe("calculateReadinessScore", () => {
  it("scales 0 to 100", () => {
    expect(calculateReadinessScore(0, 10)).toBe(0);
    expect(calculateReadinessScore(5, 10)).toBe(50);
    expect(calculateReadinessScore(12, 10)).toBe(100);
    expect(calculateReadinessScore(3, 0)).toBe(0);
  });
});

describe("calculateSentence", () => {
  const start = new Date(2020, 0, 1);
  const today = new Date(2022, 0, 1);

  it("uses the state's fraction-served range for non-violent offenses", () => {
    const r = calculateSentence({ state: "IL", sentenceYears: 4, violent: false, completedPrograms: false, startDate: start, today });
    expect(r).not.toBeNull();
    expect(r!.minServeMonths).toBe(24);
    expect(r!.maxServeMonths).toBe(24);
    expect(r!.earliestRelease.getFullYear()).toBe(2022);
  });

  it("credits completed programs and serves full time for violent offenses", () => {
    const programs = calculateSentence({ state: "TX", sentenceYears: 10, violent: false, completedPrograms: true, startDate: start, today });
    expect(programs!.minServeMonths).toBe(24);
    const violent = calculateSentence({ state: "TX", sentenceYears: 10, violent: true, completedPrograms: false, startDate: start, today });
    expect(violent!.maxServeMonths).toBe(120);
  });

  it("returns null for unknown states or invalid input", () => {
    expect(calculateSentence({ state: "ZZ", sentenceYears: 2, violent: false, completedPrograms: false, startDate: start })).toBeNull();
    expect(calculateSentence({ state: "TX", sentenceYears: 0, violent: false, completedPrograms: false, startDate: start })).toBeNull();
  });
});
