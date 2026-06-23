import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { AuthForm } from '@/components/landing/auth-form'

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh bg-background text-foreground">
      {/* Brand panel */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border/40 bg-card/40 p-10 lg:flex">
        <Link href="/" aria-label="ProseParse home">
          <Logo />
        </Link>

        <blockquote className="max-w-md">
          <p className="text-balance font-serif text-3xl font-medium leading-snug tracking-tight text-foreground">
            &ldquo;The lighthouse held its breath. She pressed her palm to the
            cold glass and tasted salt on the wind.&rdquo;
          </p>
          <footer className="mt-5 text-sm text-muted-foreground">
            A passage from a draft, read closely — its tension, voice, and
            sensory texture mapped line by line.
          </footer>
        </blockquote>

        <span className="text-sm text-muted-foreground">
          A quiet place to read your own writing more closely.
        </span>
      </aside>

      {/* Form panel */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="p-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-16">
          <AuthForm />
        </div>
      </div>
    </main>
  )
}
