import Link from "next/link";

const crisisResources = [
  {
    name: "988 Suicide & Crisis Lifeline",
    desc: "Free, confidential support 24/7 for anyone in distress. Call or text 988.",
    contact: "Call or text: 988",
  },
  {
    name: "Crisis Text Line",
    desc: "Text HOME to 741741 to connect with a trained crisis counselor. Free, confidential, 24/7.",
    contact: "Text HOME to 741741",
  },
  {
    name: "SAMHSA National Helpline",
    desc: "Treatment referral and information for mental health and substance use disorders. Free, confidential, 24/7.",
    contact: "1-800-662-4357",
  },
  {
    name: "Veterans Crisis Line",
    desc: "Confidential support for veterans, service members, and their loved ones. Available 24/7.",
    contact: "Call 988, then press 1",
  },
];

const mentalHealthServices = [
  {
    name: "Community Mental Health Centers",
    desc: "Sliding-scale and free counseling at federally qualified health centers near you.",
    contact: "findahealthcenter.hrsa.gov",
  },
  {
    name: "Open Path Collective",
    desc: "Affordable therapy sessions ($30–$80) with licensed professionals for people in financial need.",
    contact: "openpathcollective.org",
  },
  {
    name: "NAMI (National Alliance on Mental Illness)",
    desc: "Education, support groups, and advocacy resources for individuals and families.",
    contact: "nami.org | 1-800-950-6264",
  },
  {
    name: "Substance Abuse Treatment Locator",
    desc: "Find outpatient, residential, and medication-assisted treatment options in your area.",
    contact: "findtreatment.gov",
  },
];

const peerSupport = [
  {
    name: "Reentry Peer Support Groups",
    desc: "Weekly in-person and virtual groups led by people who have been through reentry themselves.",
    contact: "Ask your case manager",
  },
  {
    name: "Alcoholics Anonymous (AA)",
    desc: "Free, peer-led recovery meetings available worldwide, in-person and online.",
    contact: "aa.org",
  },
  {
    name: "Narcotics Anonymous (NA)",
    desc: "Fellowship for people in recovery from addiction. Meetings in most cities daily.",
    contact: "na.org",
  },
  {
    name: "SMART Recovery",
    desc: "Science-based, self-empowering addiction recovery support — free meetings online and in-person.",
    contact: "smartrecovery.org",
  },
];

const selfCare = [
  {
    name: "Headspace (Free Access)",
    desc: "Guided meditation and mindfulness exercises. Free plans available through many state reentry programs.",
    contact: "headspace.com",
  },
  {
    name: "Stress & Sleep Techniques",
    desc: "Simple, evidence-based tools for managing anxiety, anger, and sleep disruption in early reentry.",
    contact: "Available in the Open Road Assistant",
  },
  {
    name: "Physical Wellness Resources",
    desc: "Community health centers offering free or low-cost exercise programs, nutrition counseling, and preventive care.",
    contact: "findahealthcenter.hrsa.gov",
  },
  {
    name: "Journaling & Reflection",
    desc: "Structured journaling prompts designed for people in transition. Available free through the assistant.",
    contact: "Try the Open Road Assistant",
  },
];

interface ResourceCardProps {
  name: string;
  desc: string;
  contact: string;
}

function ResourceCard({ name, desc, contact }: ResourceCardProps) {
  return (
    <div className="card flex flex-col">
      <h3 className="font-display text-lg font-semibold text-forest">{name}</h3>
      <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-ink/70">{desc}</p>
      <p className="mt-3 font-body text-xs font-semibold text-clay">{contact}</p>
    </div>
  );
}

export default function MentalHealthPage() {
  return (
    <section className="container-edge py-16">
      {/* Crisis Banner */}
      <div className="rise mb-10 rounded-2xl border-l-4 border-clay bg-clay/10 px-6 py-5">
        <p className="font-body text-sm text-ink/80">
          <strong className="text-forest">If you are in crisis, call or text 988 (Suicide &amp; Crisis Lifeline) — available 24/7.</strong>{" "}
          You are not alone. Help is always just one call or text away. If you are in immediate danger, call{" "}
          <strong>911</strong>.
        </p>
      </div>

      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="rise rise-1 font-display text-4xl font-semibold text-forest sm:text-5xl">
          Mental health &amp; recovery
        </h1>
        <p className="rise rise-2 mt-3 font-body text-lg text-ink/70">
          Rebuilding takes a toll. These resources are here for the hard days — judgment-free,
          and many are completely free.
        </p>
      </div>

      {/* Crisis Support */}
      <div className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-forest">Crisis Support</h2>
        <p className="mt-1 font-body text-sm text-ink/60">Immediate help, any time of day or night.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {crisisResources.map((r) => (
            <ResourceCard key={r.name} {...r} />
          ))}
        </div>
      </div>

      {/* Mental Health Services */}
      <div className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-forest">Mental Health Services</h2>
        <p className="mt-1 font-body text-sm text-ink/60">
          Affordable and free counseling, therapy, and treatment programs.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {mentalHealthServices.map((r) => (
            <ResourceCard key={r.name} {...r} />
          ))}
        </div>
      </div>

      {/* Peer Support */}
      <div className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-forest">Peer Support</h2>
        <p className="mt-1 font-body text-sm text-ink/60">
          Connect with others who understand what you are going through.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {peerSupport.map((r) => (
            <ResourceCard key={r.name} {...r} />
          ))}
        </div>
      </div>

      {/* Self-Care Resources */}
      <div className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-forest">Self-Care Resources</h2>
        <p className="mt-1 font-body text-sm text-ink/60">
          Simple tools for managing stress, sleep, and daily wellbeing.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {selfCare.map((r) => (
            <ResourceCard key={r.name} {...r} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-14 rounded-2xl bg-forest px-8 py-8 text-cream">
        <h3 className="font-display text-2xl font-semibold">Not sure where to start?</h3>
        <p className="mt-2 max-w-xl font-body text-sm text-cream/80">
          The Open Road Assistant can listen, point you to the right support, and help you take the
          next small step — available any time, no judgment.
        </p>
        <Link
          href="/assistant"
          className="mt-5 inline-block rounded-full bg-gold px-6 py-3 font-body font-semibold text-forest-deep hover:bg-cream"
        >
          Talk it through →
        </Link>
      </div>
    </section>
  );
}
