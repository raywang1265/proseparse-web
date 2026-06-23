'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const isSignup = mode === 'signup'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Template UI — wire up real authentication here.
    router.push('/studio')
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

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {isSignup && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" autoComplete="name" required />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {!isSignup && (
              <button
                type="button"
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
            required
          />
        </div>

        <Button type="submit" size="lg" className="mt-2 rounded-full">
          {isSignup ? 'Create account' : 'Sign in'}
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? 'Already have an account?' : 'New to ProseParse?'}{' '}
        <button
          type="button"
          onClick={() => setMode(isSignup ? 'signin' : 'signup')}
          className="font-medium text-primary transition-opacity hover:opacity-80"
        >
          {isSignup ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </div>
  )
}
