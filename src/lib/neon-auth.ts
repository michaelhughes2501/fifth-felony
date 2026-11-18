import { createNeonAuth } from "@neon/auth/next/server";
import { cache } from "react";

export const NEON_AUTH_NOT_CONFIGURED =
  "Neon Auth is not configured. Set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET (32+ characters).";

export function isNeonAuthConfigured(): boolean {
  return Boolean(process.env.NEON_AUTH_BASE_URL && (process.env.NEON_AUTH_COOKIE_SECRET?.length ?? 0) >= 32);
}

export const getNeonAuth = cache(() => {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret || secret.length < 32) throw new Error(NEON_AUTH_NOT_CONFIGURED);
  return createNeonAuth({ baseUrl, cookies: { secret } });
});

export type AppUser = {
  id: string;
  email: string;
  user_metadata: { full_name: string; name: string };
};

// Server-side session lookup. Returns null when Neon Auth is not configured or nobody is signed in.
export async function getCurrentUser(): Promise<AppUser | null> {
  if (!isNeonAuthConfigured()) return null;
  const { data } = await getNeonAuth().getSession();
  const user = data?.user;
  if (!user) return null;
  return { id: user.id, email: user.email, user_metadata: { full_name: user.name, name: user.name } };
}
