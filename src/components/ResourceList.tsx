"use client";
import { useEffect, useState } from "react";

type Field = { key: string; label?: boolean };

export function ResourceList({
  endpoint,
  dataKey,
  title,
  subtitle,
  placeholder,
  render,
}: {
  endpoint: string;
  dataKey: string;
  title: string;
  subtitle: string;
  placeholder: string;
  render: (item: any) => React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(query = "") {
    setLoading(true);
    try {
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setItems(json[dataKey] ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="container-edge py-16">
      <div className="max-w-2xl">
        <h1 className="rise font-display text-4xl font-semibold text-forest sm:text-5xl">{title}</h1>
        <p className="rise rise-1 mt-3 font-body text-lg text-ink/70">{subtitle}</p>
      </div>

      <div className="rise rise-2 mt-8 flex max-w-xl gap-3">
        <input
          className="field"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(q)}
        />
        <button className="btn-primary shrink-0" onClick={() => load(q)}>
          Search
        </button>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-44 animate-pulse bg-cream-deep/50" />
          ))
        ) : items.length === 0 ? (
          <p className="font-body text-ink/60">No results found. Try a different search.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="card flex flex-col">
              {render(item)}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
