import { Suspense } from 'react'
import { connection } from 'next/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { AuthForm } from '@/components/landing/auth-form'
import { WritingQuote } from '@/components/landing/writing-quote'
import { pickRandomQuote } from '@/lib/writing-quotes'

export default async function LoginPage() {
  await connection()
  const quote = pickRandomQuote()

  return (
    <main className="grid min-h-dvh text-foreground lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col overflow-hidden border-r border-border/40 bg-card/40 p-10 xl:p-14 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-32 size-[34rem] rounded-full bg-primary/8 blur-3xl"
        />
        <Link href="/" aria-label="ProseParse home" className="relative w-fit">
          <Logo />
        </Link>

        <div className="relative flex flex-1 items-center">
          <WritingQuote quote={quote} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col items-center px-6">
        <div className="w-full max-w-[22rem] pt-5">
          <Link
            href="/"
            className="-ml-3 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back home
          </Link>
        </div>

        <div className="flex w-full max-w-[22rem] flex-1 flex-col justify-center pb-16">
          <WritingQuote quote={quote} size="sm" className="mb-10 lg:hidden" />
          <Suspense>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
