// Pure rule engines for the Reentry Toolkit: budget planner, record-sealing
// eligibility, readiness checklist, and sentence/release-date estimator.
// Ported from felon-connect-architect-1 (budget/expungement/readiness) and the
// New Horizon lineage (sentence calculator). Informational estimates only.

export interface BudgetInput {
  monthlyIncome: number;
  benefitsIncome: number;
  rentExpense: number;
  foodExpense: number;
  transitExpense: number;
  phoneExpense: number;
  courtFeesAndRestitution: number;
  otherExpenses: number;
}

export interface BudgetResult {
  totalIncome: number;
  totalExpenses: number;
  mandatoryLegalCosts: number;
  netCashflow: number;
  isDeficit: boolean;
  savingsRatePercent: number;
  recommendation: string;
}

const nonNeg = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

export function calculateBudget(input: BudgetInput): BudgetResult {
  const totalIncome = nonNeg(input.monthlyIncome) + nonNeg(input.benefitsIncome);
  const mandatoryLegalCosts = nonNeg(input.courtFeesAndRestitution);
  const totalExpenses =
    nonNeg(input.rentExpense) +
    nonNeg(input.foodExpense) +
    nonNeg(input.transitExpense) +
    nonNeg(input.phoneExpense) +
    mandatoryLegalCosts +
    nonNeg(input.otherExpenses);

  const netCashflow = totalIncome - totalExpenses;
  const isDeficit = netCashflow < 0;
  const savingsRatePercent =
    totalIncome > 0 ? Math.max(0, Math.round((netCashflow / totalIncome) * 100)) : 0;

  let recommendation = "Your budget is balanced. Prioritize building a $1,000 emergency fund.";
  if (isDeficit) {
    recommendation =
      "Expenses exceed income. Consider applying for 211 transit vouchers, SNAP food assistance, and contacting the clerk about a court fee sliding scale.";
  } else if (savingsRatePercent > 20) {
    recommendation =
      "Strong monthly surplus! Set aside funds for a permanent housing security deposit and professional licensing fees.";
  }

  return {
    totalIncome,
    totalExpenses,
    mandatoryLegalCosts,
    netCashflow,
    isDeficit,
    savingsRatePercent,
    recommendation,
  };
}

export const OFFENSE_TYPES = [
  "infraction",
  "misdemeanor",
  "non-violent-felony",
  "violent-felony",
  "federal",
] as const;
export type OffenseType = (typeof OFFENSE_TYPES)[number];

export interface ExpungementCriteria {
  offenseType: OffenseType;
  yearsSinceCompletion: number;
  restitutionPaidInFull: boolean;
  hasSubsequentArrests: boolean;
}

export type ExpungementStatus =
  | "likely_eligible"
  | "conditionally_eligible"
  | "ineligible_at_this_time"
  | "ineligible";

export interface ExpungementResult {
  status: ExpungementStatus;
  waitingPeriodMet: boolean;
  requiredWaitYears: number;
  summary: string;
  actionSteps: string[];
}

export function evaluateExpungement(criteria: ExpungementCriteria): ExpungementResult {
  if (criteria.offenseType === "federal") {
    return {
      status: "ineligible",
      waitingPeriodMet: false,
      requiredWaitYears: 0,
      summary:
        "General federal expungement is not currently available under federal law without a Presidential Pardon.",
      actionSteps: [
        "Research Certificate of Relief or Restoration of Rights petitions in your federal district.",
        "Consult with a federal public defender or the Office of the Pardon Attorney.",
      ],
    };
  }

  if (criteria.offenseType === "violent-felony") {
    return {
      status: "ineligible",
      waitingPeriodMet: false,
      requiredWaitYears: 10,
      summary:
        "Violent felony convictions typically cannot be sealed or expunged in most state jurisdictions.",
      actionSteps: [
        "Apply for a Governor's Pardon or Certificate of Good Conduct/Rehabilitation.",
        "Request a conviction accuracy audit through your State Bureau of Investigation to ensure no clerical errors.",
      ],
    };
  }

  let requiredWaitYears = 1;
  if (criteria.offenseType === "misdemeanor") requiredWaitYears = 2;
  if (criteria.offenseType === "non-violent-felony") requiredWaitYears = 3;

  const years = nonNeg(criteria.yearsSinceCompletion);
  const waitingPeriodMet = years >= requiredWaitYears;

  if (criteria.hasSubsequentArrests) {
    return {
      status: "ineligible_at_this_time",
      waitingPeriodMet,
      requiredWaitYears,
      summary:
        "Pending charges or subsequent arrests pause the statutory expungement clock until full resolution.",
      actionSteps: [
        "Resolve any open warrants, traffic holds, or pending matters.",
        "Maintain a clean record for the required statutory duration once all matters close.",
      ],
    };
  }

  if (!criteria.restitutionPaidInFull) {
    return {
      status: "conditionally_eligible",
      waitingPeriodMet,
      requiredWaitYears,
      summary:
        "Statutory wait time may be met, but unpaid restitution or court fines will block final petition approval.",
      actionSteps: [
        "Request an official Court Financial Obligation statement from the clerk of court.",
        "Establish a payment verification receipt or request court fee remission for indigent petitioners.",
      ],
    };
  }

  if (!waitingPeriodMet) {
    const remaining = requiredWaitYears - years;
    return {
      status: "ineligible_at_this_time",
      waitingPeriodMet: false,
      requiredWaitYears,
      summary: `Your offense category requires ${requiredWaitYears} years after completing supervision. You have ~${remaining.toFixed(1)} year(s) remaining.`,
      actionSteps: [
        "Gather your certified docket sheets and discharge paperwork in the meantime.",
        "Build documented proof of employment, volunteer service, and rehabilitation certificates.",
      ],
    };
  }

  return {
    status: "likely_eligible",
    waitingPeriodMet: true,
    requiredWaitYears,
    summary:
      "You appear to meet the primary statutory requirements for a record sealing or expungement petition.",
    actionSteps: [
      "Order certified copies of your final disposition from the sentencing court clerk.",
      "File a record sealing / expungement petition with the court in the county of conviction.",
      "Connect with a local Legal Aid clinic to review your draft petition free of charge.",
    ],
  };
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: "identity" | "finance" | "employment" | "health" | "legal";
  agency: string;
  url?: string;
}

export const READINESS_CHECKLIST: readonly ChecklistItem[] = [
  { id: "doc-birth-cert", title: "Certified Birth Certificate", category: "identity", agency: "State Bureau of Vital Statistics", url: "https://www.cdc.gov/nchs/w2w/index.htm" },
  { id: "doc-ss-card", title: "Original Social Security Card", category: "identity", agency: "Social Security Administration (SSA)", url: "https://www.ssa.gov/ssnumber/" },
  { id: "doc-state-id", title: "State Real ID or Driver License", category: "identity", agency: "Department of Motor Vehicles (DMV)", url: "https://www.usa.gov/motor-vehicle-services" },
  { id: "doc-bank-account", title: "Second-Chance Checking Account", category: "finance", agency: "Community Development Financial Institutions (CDFI)", url: "https://joinbankon.org/" },
  { id: "doc-resume", title: "Targeted Second-Chance Resume", category: "employment", agency: "Workforce Center / Reentry Navigator" },
  { id: "doc-medicaid", title: "Medicaid / Health Coverage Enrollment", category: "health", agency: "State Department of Health Care Policy", url: "https://www.healthcare.gov/" },
  { id: "doc-snap", title: "SNAP Food Assistance (EBT)", category: "finance", agency: "Department of Human Services", url: "https://www.fns.usda.gov/snap" },
  { id: "doc-transit", title: "Subsidized Public Transit Pass", category: "finance", agency: "Regional Transit Authority" },
  { id: "doc-parole-compliance", title: "Probation / Parole Compliance Log", category: "legal", agency: "Department of Corrections / Probation Office" },
  { id: "doc-apprenticeship", title: "Trade Guild or Union Apprenticeship Application", category: "employment", agency: "State Apprenticeship Agency", url: "https://www.apprenticeship.gov/" },
];

export const READINESS_ITEM_IDS = READINESS_CHECKLIST.map((i) => i.id);

export function calculateReadinessScore(completedItemsCount: number, totalItemsCount: number): number {
  if (totalItemsCount <= 0) return 0;
  const score = Math.round((nonNeg(completedItemsCount) / totalItemsCount) * 100);
  return Math.min(100, score);
}

// Fraction of the imposed sentence typically served (min = earliest, max = typical upper bound).
export const SENTENCING_RULES: Record<string, { min: number; max: number; note: string }> = {
  TX: { min: 0.25, max: 0.5, note: "Texas allows 25–50% reduction with good conduct. Violent offenses typically serve 50%+." },
  CA: { min: 0.33, max: 0.5, note: "California: 33–50% with good conduct and completion of CDCR programs." },
  FL: { min: 0.15, max: 0.85, note: "Florida has limited good-time. Most serve 85% of sentence for most offenses." },
  NY: { min: 0.33, max: 0.5, note: "New York: Merit time and good behavior can reduce sentence by up to 1/3." },
  GA: { min: 0.5, max: 0.9, note: "Georgia requires 90% served for violent offenses, 50% for non-violent." },
  IL: { min: 0.5, max: 0.5, note: "Illinois day-for-day: most offenders serve exactly 50% of their sentence." },
  OH: { min: 0.35, max: 0.5, note: "Ohio good-time credit varies by felony class, typically 35–50% reduction." },
  PA: { min: 0.33, max: 0.5, note: "Pennsylvania: minimum must be served before parole eligibility." },
  NC: { min: 0.5, max: 0.85, note: "North Carolina: structured sentencing with presumptive ranges per class." },
  MI: { min: 0.33, max: 0.5, note: "Michigan: parole eligibility at minimum, good time affects max date." },
};

export interface SentenceInput {
  state: string;
  sentenceYears: number;
  violent: boolean;
  completedPrograms: boolean;
  startDate: Date;
  today?: Date;
}

export interface SentenceResult {
  totalMonths: number;
  minServeMonths: number;
  maxServeMonths: number;
  earliestRelease: Date;
  latestRelease: Date;
  monthsServed: number;
  percentServed: number;
  stateNote: string;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

export function calculateSentence(input: SentenceInput): SentenceResult | null {
  const rule = SENTENCING_RULES[input.state];
  if (!rule || !(input.sentenceYears > 0) || Number.isNaN(input.startDate.getTime())) return null;

  const totalMonths = input.sentenceYears * 12;
  const minRatio = input.violent
    ? rule.max
    : input.completedPrograms
      ? Math.max(rule.min - 0.05, 0.1)
      : rule.min;
  const maxRatio = input.violent ? 1.0 : rule.max;
  const minServeMonths = Math.round(totalMonths * minRatio);
  const maxServeMonths = Math.round(totalMonths * maxRatio);

  const today = input.today ?? new Date();
  const monthsServed = Math.max(
    0,
    Math.round((today.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)),
  );
  const percentServed = Math.min(100, Math.round((monthsServed / totalMonths) * 100));

  return {
    totalMonths,
    minServeMonths,
    maxServeMonths,
    earliestRelease: addMonths(input.startDate, minServeMonths),
    latestRelease: addMonths(input.startDate, maxServeMonths),
    monthsServed,
    percentServed,
    stateNote: rule.note,
  };
}

export const CRISIS_LINES = [
  { label: "Emergency", number: "911", href: "tel:911", detail: "Immediate danger to you or someone else." },
  { label: "988 Suicide & Crisis Lifeline", number: "988", href: "tel:988", detail: "Call or text 24/7 for emotional distress or crisis." },
  { label: "SAMHSA National Helpline", number: "1-800-662-4357", href: "tel:18006624357", detail: "Free, confidential substance-use and mental-health referrals, 24/7." },
  { label: "211 Community Resources", number: "211", href: "tel:211", detail: "Local help with housing, food, utilities, and transportation." },
] as const;
