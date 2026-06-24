import 'server-only'

import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'

export type ServerUser = {
  uid: string
  email: string | null
  name: string | null
  picture: string | null
}

// Reads and verifies the session cookie. Returns the authenticated user, or
// null if there is no valid session. Use this in server components / route
// handlers to gate access and identify the current user. `checkRevoked`
// catches sessions that were revoked since the cookie was minted.
export async function getCurrentUser(): Promise<ServerUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) return null

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded.name as string | undefined) ?? null,
      picture: (decoded.picture as string | undefined) ?? null,
    }
  } catch {
    return null
  }
}
