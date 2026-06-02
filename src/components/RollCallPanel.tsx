"use client";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import type { CheckInStatus, DailyCheckIn } from "@/types";

const STATUS_OPTIONS: { value: CheckInStatus; label: string; helper: string }[] = [
  { value: "steady", label: "Steady", helper: "I am okay today." },
  { value: "needs_support", label: "Need support", helper: "I would like my PO to check in." },
  { value: "urgent", label: "Urgent", helper: "I need immediate supervisor attention." },
];

export function RollCallPanel({ initialCheckIn }: { initialCheckIn: DailyCheckIn | null }) {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [status, setStatus] = useState<CheckInStatus>("steady");
  const [moodScore, setMoodScore] = useState(3);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/roll-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          mood_score: moodScore,
          support_needed: status !== "steady",
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Roll Call could not be saved", "error");
        return;
      }
      setCheckIn(json.check_in);
      toast("Roll Call complete. Good Time added.");
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  }

  if (checkIn) {
    return (
      <section className="panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Roll Call</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-forest">Checked in today</h2>
          </div>
          <span className="status-chip">+{checkIn.points_awarded} Good Time</span>
        </div>
        <p className="mt-4 font-body text-sm text-ink/70">
          Your PO can see this status and follow up if support was requested.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <p className="eyebrow">Roll Call</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-forest">Daily status confirmation</h2>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatus(option.value)}
            className={
              "rounded-lg border px-3 py-3 text-left font-body transition " +
              (status === option.value
                ? "border-forest bg-forest text-cream"
                : "border-forest/15 bg-white/60 text-ink hover:border-forest/40")
            }
          >
            <span className="block text-sm font-semibold">{option.label}</span>
            <span className={status === option.value ? "mt-1 block text-xs text-cream/75" : "mt-1 block text-xs text-ink/55"}>
              {option.helper}
            </span>
          </button>
        ))}
      </div>

      <label className="mt-5 block font-body text-sm font-semibold text-ink/70" htmlFor="mood-score">
        Today&apos;s stability score
      </label>
      <input
        id="mood-score"
        type="range"
        min="1"
        max="5"
        value={moodScore}
        onChange={(e) => setMoodScore(Number(e.target.value))}
        className="mt-2 w-full accent-forest"
      />
      <div className="mt-1 flex justify-between font-body text-xs text-ink/50">
        <span>Hard day</span>
        <span>{moodScore}/5</span>
        <span>Solid</span>
      </div>

      <textarea
        className="field mt-5 min-h-24"
        placeholder="Optional note for your PO"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button className="btn-primary mt-4 w-full sm:w-auto" onClick={submit} disabled={busy}>
        {busy ? "Saving..." : "Complete Roll Call"}
      </button>
    </section>
  );
}
