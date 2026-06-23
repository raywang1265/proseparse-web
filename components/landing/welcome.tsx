import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PreviewMock } from './preview-mock'

export function Welcome() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-12 px-5 py-16 lg:py-24">
      <div className="flex max-w-2xl flex-col items-center text-center">
        <h1 className="text-balance font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          Hello, and welcome to ProseParse.
        </h1>

        <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          A little workshop I built for reading drafts more closely. Drop in a
          chapter and it&apos;ll sit beside your words, quietly mapping their
          tension, pacing, voice, and sensory texture — so you can notice the
          things that are easy to miss while you&apos;re writing.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/studio">
              Open the studio
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Made for friends who love their drafts. Your manuscript stays yours.
        </p>
      </div>

      <PreviewMock />
    </section>
  )
}
