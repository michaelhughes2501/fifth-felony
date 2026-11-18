"use client";

// Browser auth facade over Neon Auth. Method names match the calls already used by
// the pages and components (getUser, signInWithPassword, signUp, signOut,
// onAuthStateChange) so those call sites did not need to change.
import { createAuthClient, type VanillaBetterAuthClient } from "@neon/auth";
import { BetterAuthVanillaAdapter } from "@neon/auth/vanilla/adapters";

const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL;

type SessionUser = { id: string; email: string; user_metadata: { full_name: string; name: string } };
type AuthListener = (event: "SIGNED_IN" | "SIGNED_OUT", session: { user: SessionUser } | null) => void;

const listeners = new Set<AuthListener>();
let neon: VanillaBetterAuthClient | null = null;

function client() {
  if (!authUrl) throw new Error("NEXT_PUBLIC_NEON_AUTH_BASE_URL is not configured.");
  neon ??= createAuthClient(authUrl, { adapter: BetterAuthVanillaAdapter() });
  return neon;
}

function toUser(user: { id: string; email: string; name: string } | null | undefined): SessionUser | null {
  if (!user) return null;
  return { id: user.id, email: user.email, user_metadata: { full_name: user.name, name: user.name } };
}

async function currentUser(): Promise<SessionUser | null> {
  const { data } = await client().getSession();
  const session = data as { user?: { id: string; email: string; name: string } } | null;
  return toUser(session?.user);
}

async function broadcast() {
  const user = await currentUser().catch(() => null);
  listeners.forEach((listener) =>
    listener(user ? "SIGNED_IN" : "SIGNED_OUT", user ? { user } : null),
  );
}

export function createClient() {
  return {
    auth: {
      async getUser() {
        try {
          return { data: { user: await currentUser() }, error: null };
        } catch (error) {
          return { data: { user: null }, error };
        }
      },
      onAuthStateChange(callback: AuthListener) {
        listeners.add(callback);
        return { data: { subscription: { unsubscribe: () => { listeners.delete(callback); } } } };
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const { error } = await client().signIn.email({ email, password });
        if (!error) await broadcast();
        return { error: error ? new Error(error.message) : null };
      },
      async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { name?: string } } }) {
        const { error } = await client().signUp.email({ email, password, name: options?.data?.name ?? email });
        if (!error) await broadcast();
        return { error: error ? new Error(error.message) : null };
      },
      async signOut() {
        await client().signOut();
        await broadcast();
        return { error: null };
      },
    },
  };
}
