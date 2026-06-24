import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'

// Lightweight route gate. This only checks for the *presence* of the session
// cookie — it does not verify it (the Admin SDK can't run on the Edge runtime).
// Full verification happens server-side via getCurrentUser() / the session
// route. This is enough to keep unauthenticated users out of the studio UX and
// to send signed-in users straight to their workspace.
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME)
  const { pathname } = request.nextUrl

  const isStudio = pathname.startsWith('/studio')
  const isLogin = pathname === '/login'

  if (isStudio && !hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isLogin && hasSession) {
    return NextResponse.redirect(new URL('/studio', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/studio/:path*', '/login'],
}
