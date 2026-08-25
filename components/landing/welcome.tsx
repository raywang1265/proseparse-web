import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InkToChart } from './hero/ink-to-chart'

export function Welcome() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 pt-10 pb-6 sm:pt-14 lg:pt-16">
      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        <h1 className="sr-only">Welcome to ProseParse</h1>
        <InkToChart />

        <p className="-mt-2 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:-mt-4">
          A little tool I built, using ML techniques to process prose like data in order to give some broad insights into your writing
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
      </div>

      <footer className="mt-auto flex w-full max-w-lg flex-col items-center gap-2.5 pt-16 pb-1">
        <p className="rounded-full border border-border/50 bg-card/40 px-3.5 py-1 text-[11px] leading-relaxed tracking-wide text-muted-foreground/80 backdrop-blur-sm">
          A work in progress; treat the results with a grain of salt.
        </p>
        <p className="text-xs text-muted-foreground/60">
          Made for myself and anyone else who’s writing fiction :)
        </p>
      </footer>
    </section>
  )
}
