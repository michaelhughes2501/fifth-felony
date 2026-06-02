"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "checkbox" | "select";
  options?: string[];
  required?: boolean;
};

type Row = Record<string, any> & { id: string };

export function ResourceManager({
  endpoint,
  dataKey,
  singular,
  fields,
  display,
}: {
  endpoint: string;            // e.g. /api/jobs
  dataKey: string;             // response key for list, e.g. "jobs"
  singular: string;            // e.g. "Job"
  fields: FieldDef[];
  display: (row: Row) => string; // headline for a row
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      setRows(json[dataKey] ?? []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  function startCreate() {
    const blank: Record<string, any> = {};
    fields.forEach((f) => (blank[f.key] = f.type === "checkbox" ? true : ""));
    setForm(blank);
    setEditing({ id: "__new__" } as Row);
  }

  function startEdit(row: Row) {
    const f: Record<string, any> = {};
    fields.forEach((fd) => (f[fd.key] = row[fd.key] ?? (fd.type === "checkbox" ? false : "")));
    setForm(f);
    setEditing(row);
  }

  async function submit() {
    setBusy(true);
    try {
      const isNew = editing?.id === "__new__";
      const res = await fetch(isNew ? endpoint : `${endpoint}/${editing!.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { toast(json.error || "Save failed", "error"); return; }
      toast(isNew ? `${singular} created` : `${singular} updated`);
      setEditing(null);
      load();
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: Row) {
    if (!confirm(`Delete "${display(row)}"? This can't be undone.`)) return;
    const res = await fetch(`${endpoint}/${row.id}`, { method: "DELETE" });
    if (!res.ok) { toast("Delete failed", "error"); return; }
    toast(`${singular} deleted`);
    setRows((r) => r.filter((x) => x.id !== row.id));
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-forest">{dataKey[0].toUpperCase() + dataKey.slice(1)}</h2>
        <button className="btn-primary py-2.5 text-sm" onClick={startCreate}>＋ New {singular.toLowerCase()}</button>
      </div>

      {loading ? (
        <div className="card h-24 animate-pulse bg-cream-deep/50" />
      ) : rows.length === 0 ? (
        <p className="font-body text-ink/60">Nothing here yet. Create the first {singular.toLowerCase()}.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="card flex items-center justify-between py-4">
              <span className="font-body font-semibold text-ink">{display(row)}</span>
              <div className="flex gap-3">
                <button onClick={() => startEdit(row)} className="font-body text-sm font-semibold text-forest hover:underline">Edit</button>
                <button onClick={() => remove(row)} className="font-body text-sm font-semibold text-clay hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-cream p-7 shadow-xl rise" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl font-semibold text-forest">
              {editing.id === "__new__" ? `New ${singular.toLowerCase()}` : `Edit ${singular.toLowerCase()}`}
            </h3>
            <div className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block font-body text-sm font-semibold text-ink/70">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea className="field min-h-24" value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                  ) : f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 font-body text-sm text-ink/80">
                      <input type="checkbox" checked={!!form[f.key]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} />
                      Yes
                    </label>
                  ) : f.type === "select" ? (
                    <select className="field" value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                      <option value="">—</option>
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="field" value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-ghost py-2.5 text-sm" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary py-2.5 text-sm" onClick={submit} disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
