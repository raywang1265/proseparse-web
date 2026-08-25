import 'server-only'

import dns from 'node:dns'

// Firebase Admin SDK (server-side only). Used to verify ID tokens, mint and
// verify long-lived session cookies, and look up users. Credentials come from
// a service account and must never reach the browser.
import {
  getApps,
  getApp,
  initializeApp,
  cert,
  type App,
} from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'

// Some serverless network paths have broken/black-holed IPv6 egress to
// Google's APIs: Node's resolver returns an AAAA record, the connection
// attempt silently hangs instead of failing fast, and the request only
// succeeds after a ~60s fallback to IPv4. Preferring IPv4 first avoids that
// stall for every outbound call the Admin SDK makes (JWKS fetch, token
// verification, etc). See https://github.com/firebase/firebase-admin-python/issues/711
// for the same symptom in another Firebase Admin SDK.
dns.setDefaultResultOrder('ipv4first')

function getAdminApp(): App {
  if (getApps().length) return getApp()

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  // Private keys are stored with literal "\n" sequences in env vars; restore
  // them to real newlines before handing the key to the SDK.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment.',
    )
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })
}

export const adminAuth: Auth = getAuth(getAdminApp())
