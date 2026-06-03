"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import type { JobApplication } from "@/types";

const STATUSES: JobApplication["status"][] = [
  "interested",
  "applied",
  "interviewing",
  "hired",
  "closed",
];

const STATUS_STYLE: Record<JobApplication["status"], string> = {
  interested: "bg-sage/20 text-forest",
  applied: "bg-gold/25 text-forest-deep",
  interviewing: "bg-clay/15 text-clay",
  hired: "bg-forest text-cream",
  closed: "bg-ink/10 text-ink/60",
};

export function ApplicationTracker() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load(signal?: AbortSignal) {
    setLoading(true);
    try {
      const res = await fetch("/api/applications", { signal });
      const json = await res.json();
      setApps(json.applications ?? []);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setApps([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, []);

  async function setStatus(id: string, status: JobApplication["status"]) {
    // optimistic update
    setApps((a) => a.map((x) => (x.id === id ? { ...x, status } : x)));
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { toast("Couldn't update status", "error"); load(); }
  }

  async function remove(id: string) {
    const prev = apps;
    setApps((a) => a.filter((x) => x.id !== id));
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (!res.ok) { toast("Couldn't remove", "error"); setApps(prev); }
    else toast("Removed");
  }

  if (loading) return <div className="card h-32 animate-pulse bg-cream-deep/50" />;

  if (apps.length === 0)
    return (
      <div className="card">
        <p className="font-body text-ink/65">
          No saved jobs yet. Browse <a href="/jobs" className="font-semibold text-forest hover:underline">Find work</a> and tap “Save” to track your applications here.
        </p>
      </div>
    );

  return (
    <div className="space-y-3">
      {apps.map((app) => (
        <div key={app.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h4 className="font-display text-lg font-semibold text-forest">
              {app.jobs?.title ?? "Job"}
            </h4>
            <p className="font-body text-sm text-ink/65">
              {app.jobs?.company}{app.jobs?.location ? ` · ${app.jobs.location}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={app.status}
              onChange={(e) => setStatus(app.id, e.target.value as JobApplication["status"])}
              className={"rounded-full px-3 py-1.5 font-body text-xs font-semibold capitalize outline-none " + STATUS_STYLE[app.status]}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-cream text-ink">{s}</option>
              ))}
            </select>
            {app.jobs?.apply_url && (
              <a href={app.jobs.apply_url} target="_blank" rel="noreferrer"
                 className="font-body text-xs font-semibold text-clay hover:underline">Apply →</a>
            )}
            <button onClick={() => remove(app.id)}
              className="font-body text-xs font-semibold text-ink/40 hover:text-clay">Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}
