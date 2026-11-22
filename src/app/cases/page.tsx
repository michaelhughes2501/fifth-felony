"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import type { LegalCase, LegalCaseStatus, LegalCaseType } from "@/types";

const CASE_TYPES: [LegalCaseType, string][] = [
  ["criminal", "Criminal"],
  ["probation_parole", "Probation / parole"],
  ["expungement", "Expungement / sealing"],
  ["family", "Family / custody"],
  ["civil", "Civil"],
  ["other", "Other"],
];
const STATUSES: [LegalCaseStatus, string][] = [
  ["open", "Open"],
  ["pending_hearing", "Hearing scheduled"],
  ["on_supervision", "On supervision"],
  ["closed", "Closed"],
  ["dismissed", "Dismissed"],
];

interface FormState {
  case_number: string;
  court: string;
  case_type: LegalCaseType;
  status: LegalCaseStatus;
  next_hearing_at: string;
  attorney: string;
  notes: string;
}
const EMPTY: FormState = { case_number: "", court: "", case_type: "criminal", status: "open", next_hearing_at: "", attorney: "", notes: "" };

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const labelOf = (list: [string, string][], v: string) => list.find(([k]) => k === v)?.[1] ?? v;

export default function CasesPage() {
  const toast = useToast();
  const [cases, setCases] = useState<LegalCase[] | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [now] = useState(Date.now);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cases");
      if (res.status === 401) { setSignedOut(true); setCases([]); return; }
      const json = await res.json();
      if (!res.ok) toast(json.error ?? "Couldn't load cases", "error");
      setCases(json.cases ?? []);
    } catch {
      setCases([]);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const reset = () => { setForm(EMPTY); setEditingId(null); setShowForm(false); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      next_hearing_at: form.next_hearing_at ? new Date(form.next_hearing_at).toISOString() : null,
      attorney: form.attorney || null,
      notes: form.notes || null,
    };
    const res = await fetch(editingId ? `/api/cases/${editingId}` : "/api/cases", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { toast(json.error ?? "Couldn't save case", "error"); return; }
    toast(editingId ? "Case updated" : "Case added");
    reset();
    void load();
  }

  function startEdit(c: LegalCase) {
    setEditingId(c.id);
    setForm({
      case_number: c.case_number,
      court: c.court,
      case_type: c.case_type,
      status: c.status,
      next_hearing_at: toLocalInput(c.next_hearing_at),
      attorney: c.attorney ?? "",
      notes: c.notes ?? "",
    });
    setShowForm(true);
  }

  async function remove(c: LegalCase) {
    if (!window.confirm(`Delete case #${c.case_number}?`)) return;
    const res = await fetch(`/api/cases/${c.id}`, { method: "DELETE" });
    if (!res.ok) toast("Couldn't delete case", "error");
    void load();
  }

  if (signedOut) {
    return (
      <div className="container-edge py-16 text-center">
        <h1 className="font-display text-4xl font-semibold text-forest">My Cases</h1>
        <p className="mt-3 font-body text-ink/70">Keep case numbers, courts, and hearing dates in one private place.</p>
        <Link href="/login" className="btn-primary mt-6">Sign in to get started</Link>
      </div>
    );
  }

  return (
    <div className="container-edge py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Legal case tracker</p>
          <h1 className="font-display text-4xl font-semibold text-forest">My Cases</h1>
          <p className="mt-2 font-body text-ink/70">Private to you. Upcoming hearings are listed first.</p>
        </div>
        {!showForm && <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditingId(null); setShowForm(true); }}>Add case</button>}
      </div>

      {showForm && (
        <form onSubmit={submit} className="panel mt-8 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-forest">{editingId ? "Edit case" : "New case"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-body text-sm font-medium text-ink/75">Case number
              <input required maxLength={60} className="field mt-1" value={form.case_number} onChange={(e) => set("case_number", e.target.value)} />
            </label>
            <label className="font-body text-sm font-medium text-ink/75">Court
              <input required maxLength={120} placeholder="e.g. Cook County Circuit Court" className="field mt-1" value={form.court} onChange={(e) => set("court", e.target.value)} />
            </label>
            <label className="font-body text-sm font-medium text-ink/75">Case type
              <select className="field mt-1" value={form.case_type} onChange={(e) => set("case_type", e.target.value as LegalCaseType)}>
                {CASE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="font-body text-sm font-medium text-ink/75">Status
              <select className="field mt-1" value={form.status} onChange={(e) => set("status", e.target.value as LegalCaseStatus)}>
                {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="font-body text-sm font-medium text-ink/75">Next hearing / check-in
              <input type="datetime-local" className="field mt-1" value={form.next_hearing_at} onChange={(e) => set("next_hearing_at", e.target.value)} />
            </label>
            <label className="font-body text-sm font-medium text-ink/75">Attorney / public defender
              <input maxLength={120} className="field mt-1" value={form.attorney} onChange={(e) => set("attorney", e.target.value)} />
            </label>
          </div>
          <label className="block font-body text-sm font-medium text-ink/75">Notes
            <textarea rows={3} maxLength={2000} placeholder="Conditions, documents to bring, questions for your lawyer" className="field mt-1" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving…" : editingId ? "Save changes" : "Add case"}</button>
            <button type="button" className="btn-ghost" onClick={reset}>Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {cases === null && <div className="card h-24 animate-pulse bg-cream-deep/50" />}
        {cases && cases.length === 0 && !showForm && <div className="card font-body text-ink/65">No cases yet. Add one to keep hearing dates and notes in one place.</div>}
        {cases?.map((c) => {
          const hearing = c.next_hearing_at ? new Date(c.next_hearing_at) : null;
          const days = hearing ? Math.ceil((hearing.getTime() - now) / 86_400_000) : null;
          const soon = days !== null && days >= 0 && days <= 7;
          return (
            <article key={c.id} className={`card ${soon ? "border-clay/50" : ""}`}>
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-semibold text-forest">#{c.case_number}</h3>
                  <p className="font-body text-sm text-ink/60">{c.court}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="pill">{labelOf(CASE_TYPES, c.case_type)}</span>
                    <span className="status-chip">{labelOf(STATUSES, c.status)}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 font-body text-sm">
                  <button className="text-forest underline" onClick={() => startEdit(c)}>Edit</button>
                  <button className="text-clay underline" onClick={() => void remove(c)}>Delete</button>
                </div>
              </div>
              {hearing && (
                <p className={`mt-3 font-body text-sm ${soon ? "font-semibold text-clay" : "text-ink/80"}`}>
                  Next hearing: {hearing.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  {days !== null && days >= 0 && <span className="text-ink/55"> · in {days === 0 ? "less than a day" : `${days} day${days === 1 ? "" : "s"}`}</span>}
                  {days !== null && days < 0 && <span className="text-ink/55"> · past</span>}
                </p>
              )}
              {c.attorney && <p className="mt-2 font-body text-sm text-ink/65">Attorney: {c.attorney}</p>}
              {c.notes && <p className="mt-2 whitespace-pre-line font-body text-sm text-ink/80">{c.notes}</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
