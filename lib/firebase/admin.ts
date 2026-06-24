import 'server-only'

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
