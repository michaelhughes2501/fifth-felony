"use client";
import { useEffect, useState } from "react";
import { ResourceManager, type FieldDef } from "@/components/ResourceManager";
import { createClient } from "@/lib/supabase-browser";

const jobFields: FieldDef[] = [
  { key: "title", label: "Title", required: true },
  { key: "company", label: "Company", required: true },
  { key: "location", label: "Location" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "apply_url", label: "Apply URL" },
  { key: "fair_chance", label: "Fair-chance employer", type: "checkbox" },
];

const housingFields: FieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "type", label: "Type", type: "select", options: ["transitional", "rental", "halfway", "shelter"] },
  { key: "location", label: "Location" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "contact", label: "Contact" },
];

const legalFields: FieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "category", label: "Category" },
  { key: "location", label: "Location" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "contact", label: "Contact" },
];

const TABS = ["jobs", "housing", "legal"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("jobs");
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRole(null);
        setChecking(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setRole(profile?.role ?? null);
      setChecking(false);
    }
    checkRole();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (checking) {
    return (
      <section className="container-edge py-16">
        <div className="h-32 animate-pulse rounded-2xl bg-cream-deep/50" />
      </section>
    );
  }

  if (!role || (role !== "admin" && role !== "provider")) {
    return (
      <section className="container-edge py-16">
        <div className="rounded-2xl border border-clay/30 bg-clay/10 px-8 py-10 text-center">
          <h1 className="font-display text-3xl font-semibold text-clay">Access Denied</h1>
          <p className="mt-3 font-body text-ink/70">
            You do not have permission to view this page. This area is restricted to
            administrators and providers.
          </p>
          <p className="mt-2 font-body text-sm text-ink/50">
            If you believe this is an error, please contact your case manager or administrator.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container-edge py-16">
      <span className="pill">Provider portal</span>
      <h1 className="mt-4 font-display text-4xl font-semibold text-forest sm:text-5xl">Manage resources</h1>
      <p className="mt-3 max-w-xl font-body text-lg text-ink/70">
        Add and maintain the jobs, housing, and legal resources members see.
      </p>

      <div className="mt-8 flex gap-2 border-b border-forest/10">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={
              "px-4 py-2.5 font-body text-sm font-semibold capitalize transition " +
              (tab === t ? "border-b-2 border-clay text-forest" : "text-ink/55 hover:text-forest")
            }>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "jobs" && (
          <ResourceManager endpoint="/api/jobs" dataKey="jobs" singular="Job"
            fields={jobFields} display={(r) => `${r.title} — ${r.company}`} />
        )}
        {tab === "housing" && (
          <ResourceManager endpoint="/api/housing" dataKey="housing" singular="Housing"
            fields={housingFields} display={(r) => r.name} />
        )}
        {tab === "legal" && (
          <ResourceManager endpoint="/api/legal" dataKey="legal" singular="Legal resource"
            fields={legalFields} display={(r) => r.name} />
        )}
      </div>
    </section>
  );
}
