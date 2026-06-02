import Link from "next/link";

const resources = [
  { title: "988 Suicide & Crisis Lifeline", desc: "Free, confidential support 24/7 for anyone in distress. Call or text 988.", tag: "Crisis" },
  { title: "SAMHSA National Helpline", desc: "Treatment referral and information for mental health and substance use. 1-800-662-4357.", tag: "Helpline" },
  { title: "Peer Support Groups", desc: "Weekly in-person and virtual groups led by people who've been through reentry.", tag: "Community" },
  { title: "Free & Low-Cost Counseling", desc: "Sliding-scale therapists and community mental health centers near you.", tag: "Counseling" },
  { title: "Substance Recovery Programs", desc: "Outpatient and residential recovery options, including medication-assisted treatment.", tag: "Recovery" },
  { title: "Stress & Sleep Tools", desc: "Simple, free techniques for managing anxiety, anger, and sleep in early reentry.", tag: "Self-care" },
];

export default function MentalHealthPage() {
  return (
    <section className="container-edge py-16">
      <div className="rise mb-10 rounded-2xl border-l-4 border-clay bg-clay/10 px-6 py-5">
        <p className="font-body text-sm text-ink/80">
          <strong className="text-forest">In crisis right now?</strong> You are not alone.
          Call or text <strong>988</strong> any time, or call <strong>911</strong> if you're in immediate danger.
        </p>
      </div>

      <div className="max-w-2xl">
        <h1 className="rise rise-1 font-display text-4xl font-semibold text-forest sm:text-5xl">Mental health &amp; recovery</h1>
        <p className="rise rise-2 mt-3 font-body text-lg text-ink/70">
          Rebuilding takes a toll. These resources are here for the hard days — judgment-free, and many are free.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <div key={r.title} className="card flex flex-col">
            <span className="pill mb-3 w-fit">{r.tag}</span>
            <h3 className="font-display text-xl font-semibold text-forest">{r.title}</h3>
            <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-ink/70">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-forest px-8 py-8 text-cream">
        <h3 className="font-display text-2xl font-semibold">Not sure where to start?</h3>
        <p className="mt-2 max-w-xl font-body text-sm text-cream/80">
          The Open Road Assistant can listen, point you to the right support, and help you take the next small step.
        </p>
        <Link href="/assistant" className="mt-5 inline-block rounded-full bg-gold px-6 py-3 font-body font-semibold text-forest-deep hover:bg-cream">
          Talk it through →
        </Link>
      </div>
    </section>
  );
}
