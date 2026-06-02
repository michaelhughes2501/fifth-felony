"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/use-user";
import { useToast } from "@/components/Toast";
import type { Job } from "@/types";

export default function JobsPage() {
  const [q, setQ] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { signedIn } = useUser();
  const toast = useToast();

  async function load(query = "") {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setJobs(json.jobs ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(jobId: string) {
    setSaving(jobId);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const json = await res.json();
      if (res.status === 401) {
        toast("Sign in to save jobs", "error");
      } else if (!res.ok) {
        toast(json.error?.includes("duplicate") ? "Already on your list" : "Couldn't save", "error");
      } else {
        toast("Saved to your dashboard");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="container-edge py-16">
      <div className="max-w-2xl">
        <h1 className="rise font-display text-4xl font-semibold text-forest sm:text-5xl">Find work</h1>
        <p className="rise rise-1 mt-3 font-body text-lg text-ink/70">
          Fair-chance employers who are ready to hire. Every listing here welcomes people with a record.
        </p>
      </div>

      <div className="rise rise-2 mt-8 flex max-w-xl gap-3">
        <input className="field" placeholder="Search by title, company, or city…"
          value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)} />
        <button className="btn-primary shrink-0" onClick={() => load(q)}>Search</button>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-52 animate-pulse bg-cream-deep/50" />
          ))
        ) : jobs.length === 0 ? (
          <p className="font-body text-ink/60">No results found. Try a different search.</p>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="card flex flex-col">
              {job.fair_chance && <span className="pill mb-3 w-fit">Fair chance</span>}
              <h3 className="font-display text-xl font-semibold text-forest">{job.title}</h3>
              <p className="mt-1 font-body text-sm font-semibold text-ink/80">{job.company}</p>
              <p className="font-body text-sm text-ink/55">{job.location}</p>
              <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-ink/70">{job.description}</p>
              <div className="mt-4 flex items-center gap-4">
                {job.apply_url && (
                  <a href={job.apply_url} target="_blank" rel="noreferrer"
                     className="font-body text-sm font-semibold text-clay hover:underline">
                    Apply →
                  </a>
                )}
                <button
                  onClick={() => save(job.id)}
                  disabled={saving === job.id}
                  className="ml-auto rounded-full border border-forest/25 px-4 py-1.5 font-body text-xs font-semibold text-forest transition hover:bg-forest hover:text-cream disabled:opacity-50"
                >
                  {saving === job.id ? "Saving…" : "＋ Save"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!signedIn && (
        <p className="mt-8 font-body text-sm text-ink/55">
          <Link href="/login" className="font-semibold text-forest hover:underline">Sign in</Link>{" "}
          to save jobs and track your applications on your dashboard.
        </p>
      )}
    </section>
  );
}
