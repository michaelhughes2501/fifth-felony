"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function load() {
    setLoading(true);
    const res = await fetch("/api/community");
    const json = await res.json();
    setPosts(json.posts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    setError("");
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Something went wrong");
      return;
    }
    setTitle("");
    setBody("");
    load();
  }

  return (
    <section className="container-edge py-16">
      <div className="max-w-2xl">
        <h1 className="rise font-display text-4xl font-semibold text-forest sm:text-5xl">Community</h1>
        <p className="rise rise-1 mt-3 font-body text-lg text-ink/70">
          People walking the same road. Ask questions, share wins, lift each other up.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {loading ? (
            <div className="card h-32 animate-pulse bg-cream-deep/50" />
          ) : posts.length === 0 ? (
            <p className="font-body text-ink/60">No posts yet. Be the first to start a conversation.</p>
          ) : (
            posts.map((p) => (
              <article key={p.id} className="card">
                <h3 className="font-display text-xl font-semibold text-forest">{p.title}</h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-ink/75 whitespace-pre-wrap">{p.body}</p>
                <p className="mt-4 font-body text-xs text-ink/45">
                  {p.profiles?.full_name || "A member"} · {new Date(p.created_at).toLocaleDateString()}
                </p>
              </article>
            ))
          )}
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          {signedIn ? (
            <div className="card">
              <h3 className="font-display text-lg font-semibold text-forest">Share something</h3>
              <input className="field mt-3" placeholder="Title" value={title}
                onChange={(e) => setTitle(e.target.value)} />
              <textarea className="field mt-3 min-h-32" placeholder="What's on your mind?"
                value={body} onChange={(e) => setBody(e.target.value)} />
              {error && <p className="mt-2 font-body text-sm text-clay">{error}</p>}
              <button className="btn-primary mt-3 w-full" onClick={submit}>Post</button>
            </div>
          ) : (
            <div className="card bg-forest text-cream">
              <h3 className="font-display text-lg font-semibold">Join the conversation</h3>
              <p className="mt-2 font-body text-sm text-cream/80">Sign in to post and reply.</p>
              <Link href="/login" className="mt-4 inline-block rounded-full bg-gold px-5 py-2.5 font-body text-sm font-semibold text-forest-deep hover:bg-cream">
                Sign in →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
