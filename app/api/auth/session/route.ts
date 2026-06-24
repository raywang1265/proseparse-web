import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth/constants'

export const runtime = 'nodejs'

// Exchange a freshly-minted Firebase ID token for a long-lived, httpOnly
// session cookie. The client obtains the ID token after signing in with the
// web SDK and POSTs it here.
export async function POST(request: Request) {
  let idToken: string | undefined
  try {
    const body = await request.json()
    idToken = body?.idToken
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!idToken) {
    return NextResponse.json({ error: 'Missing idToken.' }, { status: 400 })
  }

  try {
    // Verify the token first so we never mint a cookie for a bad/expired one.
    await adminAuth.verifyIdToken(idToken)

    const expiresIn = SESSION_MAX_AGE_SECONDS * 1000
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })

    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create session.' },
      { status: 401 },
    )
  }
}

// Sign out: clear the session cookie.
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  return NextResponse.json({ status: 'ok' })
}
