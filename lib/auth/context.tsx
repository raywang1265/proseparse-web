'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase/client'

type AuthContextValue = {
  user: User | null
  /** true until the initial auth state has resolved */
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Exchange the current user's ID token for a server-side session cookie.
async function establishSession(user: User) {
  const idToken = await user.getIdToken()
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) {
    throw new Error('Could not establish a session. Please try again.')
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onIdTokenChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  async function signInWithEmail(email: string, password: string) {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    await establishSession(user)
  }

  async function signUpWithEmail(
    name: string,
    email: string,
    password: string,
  ) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    if (name) await updateProfile(user, { displayName: name })
    await establishSession(user)
  }

  async function signInWithGoogle() {
    const { user } = await signInWithPopup(auth, googleProvider)
    await establishSession(user)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  async function logout() {
    await signOut(auth)
    await fetch('/api/auth/session', { method: 'DELETE' })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
