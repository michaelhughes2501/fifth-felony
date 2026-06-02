"use client";
import { useState } from "react";
import { ResourceManager, type FieldDef } from "@/components/ResourceManager";

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
