import Link from "next/link";

const domains = [
  { href: "/jobs", title: "Jobs", blurb: "Fair-chance employers ready to hire. Search, save, and track applications.", n: "01" },
  { href: "/housing", title: "Housing", blurb: "Transitional homes, rentals, and shelters that welcome you.", n: "02" },
  { href: "/mental-health", title: "Mental Health", blurb: "Counseling, support groups, and crisis lines when you need them.", n: "03" },
  { href: "/legal", title: "Legal Aid", blurb: "Expungement clinics, tenant rights, and free legal help.", n: "04" },
  { href: "/community", title: "Community", blurb: "A forum of people walking the same road. Share and ask.", n: "05" },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-gold/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-sage/20 blur-3xl" />
        <div className="container-edge relative grid gap-10 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-7">
            <span className="pill rise">A fresh start, fully supported</span>
            <h1 className="rise rise-1 mt-6 font-display text-5xl font-semibold leading-[1.05] text-forest sm:text-6xl md:text-7xl">
              The road back<br />
              <span className="text-clay">belongs to you.</span>
            </h1>
            <p className="rise rise-2 mt-6 max-w-xl font-body text-lg leading-relaxed text-ink/75">
              Open Road brings jobs, housing, mental health, legal aid, and community
              into one place — with an AI guide that knows your local resources and
              answers honestly, any hour of the day.
            </p>
            <div className="rise rise-3 mt-9 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary">Create a free account</Link>
              <Link href="/assistant" className="btn-ghost">Ask the assistant</Link>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="rise rise-2 relative rounded-3xl border border-forest/15 bg-white/50 p-7 shadow-[0_12px_40px_rgba(20,42,35,0.10)]">
              <div className="flex items-center gap-2 text-forest">
                <span className="h-2.5 w-2.5 rounded-full bg-clay" />
                <span className="font-body text-xs font-semibold uppercase tracking-wide">Open Road Assistant</span>
              </div>
              <div className="mt-5 space-y-4 font-body text-sm">
                <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-forest px-4 py-2.5 text-cream">
                  How do I start expunging my record in Massachusetts?
                </p>
                <p className="max-w-[88%] rounded-2xl rounded-bl-sm bg-cream-deep px-4 py-3 text-ink">
                  Great first step. Massachusetts has free monthly expungement
                  clinics — I can point you to the nearest one and walk you through
                  what to bring. Want me to find dates near your city?
                </p>
              </div>
              <Link href="/assistant" className="mt-5 inline-block font-body text-sm font-semibold text-clay hover:underline">
                Continue the conversation →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Domains */}
      <section className="container-edge py-8">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold text-forest sm:text-4xl">Everything in one place</h2>
          <span className="hidden font-body text-sm text-ink/50 sm:block">Five pillars of support</span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((d) => (
            <Link key={d.href} href={d.href} className="card group flex flex-col">
              <span className="font-display text-sm text-clay">{d.n}</span>
              <h3 className="mt-2 font-display text-2xl font-semibold text-forest">{d.title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/70">{d.blurb}</p>
              <span className="mt-5 font-body text-sm font-semibold text-forest opacity-0 transition group-hover:opacity-100">
                Explore →
              </span>
            </Link>
          ))}
          <div className="card flex flex-col justify-center bg-forest text-cream">
            <h3 className="font-display text-2xl font-semibold">Your dashboard</h3>
            <p className="mt-2 font-body text-sm text-cream/80">
              Track applications, saved resources, and progress toward your goals.
            </p>
            <Link href="/dashboard" className="mt-5 font-body text-sm font-semibold text-gold hover:underline">
              Go to dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="container-edge py-20">
        <div className="rounded-3xl border border-forest/10 bg-cream-deep px-8 py-12 text-center">
          <p className="mx-auto max-w-2xl font-display text-2xl font-medium leading-snug text-forest sm:text-3xl">
            “We don't ask what you did. We ask what you need next.”
          </p>
          <p className="mt-4 font-body text-sm text-ink/60">
            Private by design. Your data is yours — encrypted, and never sold.
          </p>
        </div>
      </section>
    </>
  );
}
