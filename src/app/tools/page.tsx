"use client";
import { useEffect, useState } from "react";
import {
  calculateBudget,
  calculateReadinessScore,
  calculateSentence,
  evaluateExpungement,
  OFFENSE_TYPES,
  READINESS_CHECKLIST,
  SENTENCING_RULES,
  type BudgetInput,
  type ExpungementStatus,
  type OffenseType,
} from "@/lib/reentry-tools";

type Tab = "budget" | "sealing" | "readiness" | "sentence";
const TABS: [Tab, string][] = [
  ["budget", "Budget"],
  ["sealing", "Record Sealing"],
  ["readiness", "Readiness"],
  ["sentence", "Release Estimate"],
];

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const BUDGET_FIELDS: [keyof BudgetInput, string][] = [
  ["monthlyIncome", "Monthly wages"],
  ["benefitsIncome", "Benefits (SNAP, SSI, etc.)"],
  ["rentExpense", "Rent / housing"],
  ["foodExpense", "Food"],
  ["transitExpense", "Transportation"],
  ["phoneExpense", "Phone"],
  ["courtFeesAndRestitution", "Court fees & restitution"],
  ["otherExpenses", "Other expenses"],
];

function BudgetTool() {
  const [values, setValues] = useState<Record<string, string>>({});
  const input = Object.fromEntries(BUDGET_FIELDS.map(([k]) => [k, parseFloat(values[k] ?? "") || 0])) as unknown as BudgetInput;
  const r = calculateBudget(input);
  return (
    <div className="panel">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BUDGET_FIELDS.map(([k, l]) => (
          <label key={k} className="font-body text-sm font-medium text-ink/75">
            {l}
            <input type="number" min="0" placeholder="0" className="field mt-1" value={values[k] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))} />
          </label>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {([
          ["Income", r.totalIncome, "text-forest"],
          ["Expenses", r.totalExpenses, "text-forest"],
          ["Court costs", r.mandatoryLegalCosts, "text-clay"],
          ["Net / month", r.netCashflow, r.isDeficit ? "text-clay" : "text-forest"],
        ] as const).map(([l, v, cls]) => (
          <div key={l} className="metric-card">
            <div className="eyebrow">{l}</div>
            <div className={`font-display text-2xl font-semibold ${cls}`}>{usd(v)}</div>
          </div>
        ))}
      </div>
      <p className={`mt-4 font-body text-sm ${r.isDeficit ? "text-clay" : "text-ink/70"}`}>{r.recommendation}</p>
    </div>
  );
}

const OFFENSE_LABELS: Record<OffenseType, string> = {
  infraction: "Infraction / petty offense",
  misdemeanor: "Misdemeanor",
  "non-violent-felony": "Non-violent felony",
  "violent-felony": "Violent felony",
  federal: "Federal conviction",
};
const STATUS_LABELS: Record<ExpungementStatus, string> = {
  likely_eligible: "Likely eligible",
  conditionally_eligible: "Conditionally eligible",
  ineligible_at_this_time: "Not yet eligible",
  ineligible: "Not eligible by petition",
};

function SealingTool() {
  const [offenseType, setOffenseType] = useState<OffenseType>("misdemeanor");
  const [years, setYears] = useState("");
  const [paid, setPaid] = useState(true);
  const [arrests, setArrests] = useState(false);
  const r = evaluateExpungement({ offenseType, yearsSinceCompletion: parseFloat(years) || 0, restitutionPaidInFull: paid, hasSubsequentArrests: arrests });
  return (
    <div className="panel space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="font-body text-sm font-medium text-ink/75">
          Offense category
          <select className="field mt-1" value={offenseType} onChange={(e) => setOffenseType(e.target.value as OffenseType)}>
            {OFFENSE_TYPES.map((o) => <option key={o} value={o}>{OFFENSE_LABELS[o]}</option>)}
          </select>
        </label>
        <label className="font-body text-sm font-medium text-ink/75">
          Years since sentence / supervision ended
          <input type="number" min="0" step="0.5" className="field mt-1" value={years} onChange={(e) => setYears(e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap gap-6 font-body text-sm text-ink/75">
        <label className="flex items-center gap-2"><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Fines &amp; restitution paid in full</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={arrests} onChange={(e) => setArrests(e.target.checked)} /> New arrests or open charges since</label>
      </div>
      <div className="card">
        <span className="status-chip">{STATUS_LABELS[r.status]}</span>
        <p className="mt-3 font-body text-sm text-ink/80">{r.summary}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 font-body text-sm text-ink/70">
          {r.actionSteps.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </div>
      <p className="font-body text-xs text-ink/50">General guidance only — rules vary by state. Confirm with a legal aid clinic before filing.</p>
    </div>
  );
}

function ReadinessTool() {
  const [done, setDone] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("or_readiness") ?? "[]");
      if (Array.isArray(saved)) setDone(saved.filter((x): x is string => typeof x === "string"));
    } catch { /* storage unavailable */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("or_readiness", JSON.stringify(done)); } catch { /* storage unavailable */ }
  }, [done, loaded]);
  const score = calculateReadinessScore(done.length, READINESS_CHECKLIST.length);
  return (
    <div className="panel">
      <div className="mb-2 flex justify-between font-body text-sm">
        <span>{done.length} of {READINESS_CHECKLIST.length} complete</span>
        <span className="font-semibold text-forest">{score}% ready</span>
      </div>
      <div className="mb-5 h-2.5 overflow-hidden rounded-lg bg-forest/10">
        <div className="h-full bg-forest transition-all" style={{ width: `${score}%` }} />
      </div>
      <div className="grid gap-2">
        {READINESS_CHECKLIST.map((item) => {
          const checked = done.includes(item.id);
          return (
            <label key={item.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${checked ? "border-sage bg-sage/15" : "border-forest/10 bg-white/70"}`}>
              <input type="checkbox" className="mt-1" checked={checked} onChange={() => setDone((d) => (d.includes(item.id) ? d.filter((x) => x !== item.id) : [...d, item.id]))} />
              <span className="font-body">
                <span className={`block text-sm font-semibold text-forest ${checked ? "line-through" : ""}`}>{item.title}</span>
                <span className="block text-xs text-ink/60">
                  {item.agency}
                  {item.url && <> · <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline">Learn more</a></>}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SentenceTool() {
  const [state, setState] = useState("");
  const [years, setYears] = useState("");
  const [start, setStart] = useState("");
  const [violent, setViolent] = useState(false);
  const [programs, setPrograms] = useState(false);
  const r = state && years && start
    ? calculateSentence({ state, sentenceYears: parseFloat(years), violent, completedPrograms: programs, startDate: new Date(`${start}T00:00:00`) })
    : null;
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="panel space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="font-body text-sm font-medium text-ink/75">
          State
          <select className="field mt-1" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Select a state</option>
            {Object.keys(SENTENCING_RULES).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="font-body text-sm font-medium text-ink/75">
          Sentence (years)
          <input type="number" min="0.5" step="0.5" className="field mt-1" value={years} onChange={(e) => setYears(e.target.value)} />
        </label>
        <label className="font-body text-sm font-medium text-ink/75">
          Start date
          <input type="date" className="field mt-1" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap gap-6 font-body text-sm text-ink/75">
        <label className="flex items-center gap-2"><input type="checkbox" checked={violent} onChange={(e) => setViolent(e.target.checked)} /> Violent offense</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={programs} onChange={(e) => setPrograms(e.target.checked)} /> Completed programs</label>
      </div>
      {r && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="metric-card">
            <div className="eyebrow">Earliest release</div>
            <div className="font-display text-xl font-semibold text-forest">{fmt(r.earliestRelease)}</div>
            <div className="font-body text-xs text-ink/55">{r.minServeMonths} months · {r.percentServed}% served so far</div>
          </div>
          <div className="metric-card">
            <div className="eyebrow">Latest release</div>
            <div className="font-display text-xl font-semibold text-clay">{fmt(r.latestRelease)}</div>
            <div className="font-body text-xs text-ink/55">{r.maxServeMonths} months</div>
          </div>
          <p className="font-body text-sm text-ink/70 sm:col-span-2">{r.stateNote}</p>
        </div>
      )}
      <p className="font-body text-xs text-ink/50">Estimate only — not legal advice. Actual dates depend on conduct, parole decisions, and your charges.</p>
    </div>
  );
}

export default function ToolsPage() {
  const [tab, setTab] = useState<Tab>("budget");
  return (
    <div className="container-edge py-12">
      <p className="eyebrow">Reentry toolkit</p>
      <h1 className="font-display text-4xl font-semibold text-forest">Plan your next steps</h1>
      <p className="mt-2 max-w-2xl font-body text-ink/70">Budget around court costs, check record-sealing eligibility, track your documents, and estimate release dates.</p>
      <div role="tablist" className="mt-8 mb-6 flex flex-wrap gap-2">
        {TABS.map(([id, l]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={tab === id ? "btn-primary py-2 text-sm" : "btn-ghost py-2 text-sm"}>
            {l}
          </button>
        ))}
      </div>
      <section role="tabpanel">
        {tab === "budget" && <BudgetTool />}
        {tab === "sealing" && <SealingTool />}
        {tab === "readiness" && <ReadinessTool />}
        {tab === "sentence" && <SentenceTool />}
      </section>
    </div>
  );
}
