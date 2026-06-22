import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { normalizeRole, roleAtLeast } from '@/lib/rbac'

const PROTECTED = ['/dashboard', '/admin', '/applications']

export async function middleware(request: NextRequest) {
  // Add security headers
  let response = NextResponse.next({ request })
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (PROTECTED.some(p => path.startsWith(p)) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // RBAC: /admin requires admin (or higher). Non-admins are sent to /dashboard.
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
