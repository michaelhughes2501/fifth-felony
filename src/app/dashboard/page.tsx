import { createClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { ApplicationController } from "@/controllers/application.controller";
import { ApplicationTracker } from "@/components/ApplicationTracker";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { ResidentDashboardController } from "@/controllers/resident-dashboard.controller";
import { RollCallPanel } from "@/components/RollCallPanel";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, city, goals")
    .eq("id", user.id)
    .single();

  const appCount = await ApplicationController.countMine();
  const summaryResult = await ResidentDashboardController.summary();
  const summary = summaryResult.ok ? summaryResult.data : null;

  const firstName = (profile?.full_name || "friend").split(" ")[0];

  const tiles = [
    { href: "/jobs", label: "Work Detail", desc: "Browse fair-chance opportunities" },
    { href: "/housing", label: "Commissary", desc: "Find housing and reentry resources" },
    { href: "/legal", label: "Law Library", desc: "Expungement and rights support" },
    { href: "/assistant", label: "The Clerk", desc: "Get unstuck, any time" },
    { href: "/admin", label: "Warden's Office", desc: "Manage supervised resources" },
  ];

  return (
    <section className="container-edge py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="rise">
          <span className="pill">My Cell</span>
          <h1 className="mt-4 font-display text-4xl font-semibold text-forest sm:text-5xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 font-body text-lg text-ink/70">
            Your supervised home base for Roll Call, Good Time, resources, and next steps.
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <p className="font-body text-sm text-ink/55">Work Detail saves</p>
          <p className="mt-1 font-display text-4xl font-semibold text-forest">{appCount ?? 0}</p>
        </div>
        <div className="metric-card">
          <p className="font-body text-sm text-ink/55">Good Time</p>
          <p className="mt-1 font-display text-4xl font-semibold text-forest">{summary?.goodTime.total ?? 0}</p>
          <p className="mt-1 font-body text-xs text-ink/50">+{summary?.goodTime.thisWeek ?? 0} this week</p>
        </div>
        <div className="metric-card">
          <p className="font-body text-sm text-ink/55">Tier</p>
          <p className="mt-1 font-display text-4xl font-semibold text-forest">{summary?.goodTime.tier ?? 1}</p>
          <p className="mt-1 font-body text-xs text-ink/50">{summary?.goodTime.streak ?? 0}-day Roll Call streak</p>
        </div>
        <div className="metric-card">
          <p className="font-body text-sm text-ink/55">Assigned PO</p>
          <p className="mt-1 font-display text-2xl font-semibold text-forest">
            {summary?.supervision?.supervisor_name ?? "Pending"}
          </p>
          <p className="mt-1 font-body text-xs text-ink/50">
            {summary?.supervision?.visibility_note ?? "Supervision details appear here when assigned."}
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <RollCallPanel initialCheckIn={summary?.todayCheckIn ?? null} />

        <section className="panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Good Time ledger</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-forest">Recent positive activity</h2>
            </div>
            <span className="status-chip">Tier {summary?.goodTime.tier ?? 1}</span>
          </div>

          <div className="mt-5 space-y-3">
            {(summary?.recentEvents.length ?? 0) === 0 ? (
              <p className="font-body text-sm text-ink/60">
                Complete Roll Call or save useful resources to start building Good Time.
              </p>
            ) : (
              summary?.recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-lg border border-forest/10 bg-white/55 px-4 py-3">
                  <div>
                    <p className="font-body text-sm font-semibold text-ink">{event.note ?? "Positive activity"}</p>
                    <p className="font-body text-xs text-ink/45">{new Date(event.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="font-body text-sm font-bold text-forest">+{event.points}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <h2 className="mt-12 font-display text-2xl font-semibold text-forest">Commissary List</h2>
      <div className="mt-5">
        <ApplicationTracker />
      </div>

      <h2 className="mt-12 font-display text-2xl font-semibold text-forest">Pick up where you left off</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="card group">
            <h3 className="font-display text-xl font-semibold text-forest">{t.label}</h3>
            <p className="mt-1 font-body text-sm text-ink/65">{t.desc}</p>
            <span className="mt-4 inline-block font-body text-sm font-semibold text-clay opacity-0 transition group-hover:opacity-100">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
