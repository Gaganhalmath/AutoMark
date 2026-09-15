import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore public assets and api routes (auth API routes handle themselves)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check auth cookie
  const token = request.cookies.get('sa_session')?.value
  const isAuthenticated = token ? await verifyToken(token).then(p => !!p) : false

  // If user is accessing root, redirect based on auth status
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isAuthenticated ? '/admin/dashboard' : '/admin/login', request.url))
  }

  // If unauthenticated and trying to access /admin (except login), redirect to login
  if (!isAuthenticated && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // If authenticated and trying to access login, redirect to dashboard
  if (isAuthenticated && pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
