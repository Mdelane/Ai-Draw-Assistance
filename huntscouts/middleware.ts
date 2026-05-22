import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Unauthenticated → login
  const protectedRoutes = ['/dashboard', '/outfitter', '/admin']
  if (!user && protectedRoutes.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = userData?.role

    // Hunters can't access outfitter or admin routes
    if (pathname.startsWith('/outfitter') && role !== 'outfitter' && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Only admins can access /admin
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Outfitters without a profile must complete onboarding first
    if (
      role === 'outfitter' &&
      pathname.startsWith('/outfitter') &&
      !pathname.startsWith('/outfitter/onboarding')
    ) {
      const { data: profile } = await supabase
        .from('outfitter_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        return NextResponse.redirect(new URL('/outfitter/onboarding', request.url))
      }
    }
  }

  // Unauthenticated requests to Scout AI endpoint return 401 before handler runs
  if (pathname === '/api/scout/chat' && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Suspended accounts are blocked from all API routes
  if (user && pathname.startsWith('/api/')) {
    const { data: userData } = await supabase
      .from('users')
      .select('suspended')
      .eq('id', user.id)
      .single()
    if (userData?.suspended) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/outfitter/:path*',
    '/admin/:path*',
    '/api/scout/chat',
    '/api/bookings/:path*',
    '/api/scout/:path*',
  ],
}
