import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { normalizeRole, roleAtLeast } from '@/lib/rbac'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

const PROTECTED = ['/dashboard', '/admin', '/applications']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Baseline security headers. CSP intentionally allows inline styles/scripts
  // because Next.js and the existing UI use them; a nonce-based CSP can be
  // introduced once the app is migrated to nonce-safe rendering everywhere.
  response.headers.set('Content-Security-Policy', [
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
    'upgrade-insecure-requests',
  ].join('; '))
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const isPlaceholder = (v: string) => !v || /placeholder|REPLACE|your-project/i.test(v)

  if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (PROTECTED.some(p => path.startsWith(p)) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (path.startsWith('/admin') && user) {
    let role: string | null = null
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      role = data?.role ?? null
    } catch {
      role = null
    }
    if (!roleAtLeast(normalizeRole(role), 'admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
