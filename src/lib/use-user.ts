"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

// Small client hook: returns the signed-in user (or null) and a loading flag.
export function useUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUserId(session?.user?.id ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return { userId, loading, signedIn: !!userId };
}
