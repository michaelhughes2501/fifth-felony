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
            <li><Link href="/tools" className="hover:text-clay">Reentry tools</Link></li>
          </ul>
        </div>
        <div className="font-body text-sm">
          <div className="mb-3 font-semibold uppercase tracking-wide text-cream/60">Crisis</div>
          <p className="text-cream/85">
            If you are in immediate danger, call <strong>911</strong>.<br />
            988 Suicide &amp; Crisis Lifeline: call or text <strong><a href="tel:988" className="hover:text-clay">988</a></strong>.<br />
            SAMHSA Helpline (substance use &amp; mental health, 24/7): <strong><a href="tel:18006624357" className="hover:text-clay">1-800-662-4357</a></strong>.<br />
            Local housing, food &amp; utility help: <strong><a href="tel:211" className="hover:text-clay">211</a></strong>.
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center font-body text-xs text-cream/50">
        © {new Date().getFullYear()} Open Road. This platform offers resources, not legal or medical advice.
      </div>
    </footer>
  );
}
