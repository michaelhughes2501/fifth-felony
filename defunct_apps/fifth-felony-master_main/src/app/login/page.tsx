"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function submit() {
    setBusy(true);
    setMsg("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").insert({ id: data.user.id, full_name: fullName });
        }
        setMsg("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (e: any) {
      setMsg(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container-edge flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rise">
        <div className="card">
          <h1 className="font-display text-3xl font-semibold text-forest">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 font-body text-sm text-ink/65">
            {mode === "signin"
              ? "Pick up where you left off."
              : "Free, private, and yours. Let's get started."}
          </p>

          <div className="mt-6 space-y-3">
            {mode === "signup" && (
              <input className="field" placeholder="Your name" value={fullName}
                onChange={(e) => setFullName(e.target.value)} />
            )}
            <input className="field" type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} />
            <input className="field" type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>

          {msg && <p className="mt-3 font-body text-sm text-clay">{msg}</p>}

          <button className="btn-primary mt-5 w-full" onClick={submit} disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>

          <button
            className="mt-4 w-full font-body text-sm text-ink/60 hover:text-forest"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(""); }}
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </section>
  );
}
