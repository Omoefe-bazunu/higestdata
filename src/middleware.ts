import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'

const protectedRoutes = ['/'] // Add root of app routes
const authRoutes = ['/auth/signin', '/auth/signup']
const adminRoutes = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await getSession()

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route) && route !== '/') || pathname === '/'
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !session?.uid) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  if (isAuthRoute && session?.uid) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  if (isAdminRoute && session?.role !== 'admin') {
     return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
