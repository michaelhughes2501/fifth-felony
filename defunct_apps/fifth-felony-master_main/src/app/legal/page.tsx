"use client";
import { ResourceList } from "@/components/ResourceList";

export default function LegalPage() {
  return (
    <ResourceList
      endpoint="/api/legal"
      dataKey="legal"
      title="Legal aid"
      subtitle="Free help with expungement, tenant rights, employment law, and replacing your documents."
      placeholder="Search by topic or city…"
      render={(r) => (
        <>
          <span className="pill mb-3 w-fit capitalize">{r.category}</span>
          <h3 className="font-display text-xl font-semibold text-forest">{r.name}</h3>
          <p className="font-body text-sm text-ink/55">{r.location}</p>
          <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-ink/70">{r.description}</p>
          <p className="mt-4 font-body text-sm font-semibold text-forest">{r.contact}</p>
        </>
      )}
    />
  );
}
