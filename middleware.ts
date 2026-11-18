import { createNeonAuth } from "@neon/auth/next/server";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/admin", "/applications"];
const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;
const auth = authBaseUrl && cookieSecret && cookieSecret.length >= 32
  ? createNeonAuth({ baseUrl: authBaseUrl, cookies: { secret: cookieSecret } })
  : null;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  response.headers.set("Content-Security-Policy", [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    "script-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; "));
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  const path = request.nextUrl.pathname;
  if (!auth) {
    return PROTECTED.some((prefix) => path.startsWith(prefix))
      ? NextResponse.redirect(new URL("/login", request.url))
      : response;
  }

  const protectedPath = PROTECTED.some((prefix) => path.startsWith(prefix));
  const authMiddleware = auth.middleware({
    loginUrl: "/login",
    publicRoutes: protectedPath ? [] : [path],
  });
  const authResponse = await authMiddleware(request);
  if (authResponse.status >= 300 && authResponse.status < 400) return authResponse;
  // Apply security headers after the auth middleware response.
  for (const [name, value] of response.headers) authResponse.headers.set(name, value);
  return authResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
