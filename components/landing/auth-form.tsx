'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { FirebaseError } from 'firebase/app'
import { useAuth } from '@/lib/auth/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function messageForError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'That email or password doesn’t look right.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/weak-password':
        return 'Please choose a password with at least 6 characters.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again in a moment.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

export function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/studio'
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } =
    useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const isSignup = mode === 'signup'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setPending(true)
    try {
      if (isSignup) {
        await signUpWithEmail(name, email, password)
      } else {
        await signInWithEmail(email, password)
      }
      router.push(next)
    } catch (err) {
      setError(messageForError(err))
      setPending(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setNotice(null)
    setPending(true)
    try {
      await signInWithGoogle()
      router.push(next)
    } catch (err) {
      setError(messageForError(err))
      setPending(false)
    }
  }

  async function handleForgot() {
    setError(null)
    setNotice(null)
    if (!email) {
      setError('Enter your email above, then tap “Forgot?” again.')
      return
    }
    try {
      await resetPassword(email)
      setNotice('Check your inbox for a password reset link.')
    } catch (err) {
      setError(messageForError(err))
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
        {isSignup ? 'Make yourself at home' : 'Welcome back'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isSignup
          ? 'Set up a spot to keep your drafts and notes.'
          : "Good to see you — let's pick up where you left off."}
      </p>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleGoogle}
        disabled={pending}
        className="mt-8 w-full gap-2 rounded-full"
      >
        <GoogleIcon className="size-4" />
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isSignup && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {!isSignup && (
              <button
                type="button"
                onClick={handleForgot}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Forgot?
              </button>
            )}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-sm text-primary" role="status">
            {notice}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="mt-2 rounded-full"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {isSignup ? 'Create account' : 'Sign in'}
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? 'Already have an account?' : 'New to ProseParse?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? 'signin' : 'signup')
            setError(null)
            setNotice(null)
          }}
          className="font-medium text-primary transition-opacity hover:opacity-80"
        >
          {isSignup ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.22V7.04H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}
