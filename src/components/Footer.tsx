import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-forest/10 bg-forest-deep text-cream">
      <div className="container-edge grid gap-10 py-14 md:grid-cols-3">
        <div>
          <div className="font-display text-2xl font-semibold">Open Road</div>
          <p className="mt-3 max-w-xs font-body text-sm text-cream/70">
            Holistic support for life after incarceration. Built with dignity, for people rebuilding.
          </p>
        </div>
        <div className="font-body text-sm">
          <div className="mb-3 font-semibold uppercase tracking-wide text-cream/60">Support</div>
          <ul className="space-y-2 text-cream/85">
            <li><Link href="/jobs" className="hover:text-clay">Find work</Link></li>
            <li><Link href="/housing" className="hover:text-clay">Housing</Link></li>
            <li><Link href="/legal" className="hover:text-clay">Legal aid</Link></li>
            <li><Link href="/mental-health" className="hover:text-clay">Mental health</Link></li>
          </ul>
        </div>
        <div className="font-body text-sm">
          <div className="mb-3 font-semibold uppercase tracking-wide text-cream/60">Crisis</div>
          <p className="text-cream/85">
            If you are in immediate danger, call <strong>911</strong>.<br />
            988 Suicide &amp; Crisis Lifeline: call or text <strong>988</strong>.
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center font-body text-xs text-cream/50">
        © {new Date().getFullYear()} Open Road. This platform offers resources, not legal or medical advice.
      </div>
    </footer>
  );
}
