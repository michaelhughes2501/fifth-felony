"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

const links = [
  { href: "/jobs", label: "Jobs" },
  { href: "/housing", label: "Housing" },
  { href: "/mental-health", label: "Mental Health" },
  { href: "/legal", label: "Legal Aid" },
  { href: "/community", label: "Community" },
];

export function Nav() {
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(!!session?.user)
    );
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-cream/90 backdrop-blur">
      <nav className="container-edge flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-semibold text-forest">Open Road</span>
          <span className="h-2 w-2 rounded-full bg-clay" />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-body text-sm font-medium text-ink/80 transition hover:text-forest"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {signedIn ? (
            <Link href="/dashboard" className="btn-primary py-2.5 text-sm">Dashboard</Link>
          ) : (
            <Link href="/login" className="btn-primary py-2.5 text-sm">Sign in</Link>
          )}
        </div>

        <button
          className="md:hidden text-forest"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-forest/10 bg-cream md:hidden">
          <div className="container-edge flex flex-col gap-1 py-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 font-body text-ink/80 hover:bg-forest/5">
                {l.label}
              </Link>
            ))}
            <Link href={signedIn ? "/dashboard" : "/login"} onClick={() => setOpen(false)}
              className="btn-primary mt-2 text-sm">
              {signedIn ? "Dashboard" : "Sign in"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
