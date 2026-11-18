"use client";
import { ResourceList } from "@/components/ResourceList";

export default function HousingPage() {
  return (
    <ResourceList
      endpoint="/api/housing"
      dataKey="housing"
      title="A place to land"
      subtitle="Transitional homes, affordable rentals, halfway houses, and shelters that welcome you."
      placeholder="Search by name, city, or type…"
      render={(h) => (
        <>
          <span className="pill mb-3 w-fit capitalize">{h.type}</span>
          <h3 className="font-display text-xl font-semibold text-forest">{h.name}</h3>
          <p className="font-body text-sm text-ink/55">{h.location}</p>
          <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-ink/70">{h.description}</p>
          <p className="mt-4 font-body text-sm font-semibold text-forest">{h.contact}</p>
        </>
      )}
    />
  );
}
