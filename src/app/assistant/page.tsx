"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "How do I start expunging my record?",
  "What should I put on a resume after a gap?",
  "Where can I find fair-chance jobs near me?",
  "I'm feeling overwhelmed. What can I do right now?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm the Open Road Assistant. I can help you find work, housing, legal aid, and support — and talk things through. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const json = await res.json();
      setMessages([...next, { role: "assistant", content: json.reply ?? "Sorry, try again." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container-edge flex min-h-[80vh] flex-col py-10">
      <div className="mb-5">
        <h1 className="font-display text-3xl font-semibold text-forest">Open Road Assistant</h1>
        <p className="font-body text-sm text-ink/60">
          Not legal or medical advice. In a crisis, call or text <strong>988</strong>.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-forest/10 bg-white/40 p-5">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-br-sm bg-forest px-4 py-2.5 font-body text-sm text-cream"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm bg-cream-deep px-4 py-3 font-body text-sm leading-relaxed text-ink whitespace-pre-wrap"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-cream-deep px-4 py-3 font-body text-sm text-ink/50">
              Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="rounded-full border border-forest/20 bg-cream px-4 py-2 font-body text-sm text-forest transition hover:bg-forest hover:text-cream">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <input
          className="field"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
        />
        <button className="btn-primary shrink-0" onClick={() => send(input)} disabled={busy}>
          Send
        </button>
      </div>
    </section>
  );
}
