import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'

export function Closing() {
  return (
    <>
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
        <div className="flex flex-col items-center rounded-[2rem] border border-border/50 bg-card/60 px-6 py-16 text-center">
          <h2 className="max-w-xl text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Your draft has a shape. Come see it.
          </h2>
          <p className="mt-4 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            Free while in early access. Bring a chapter and watch ProseParse map
            it in seconds.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full">
            <Link href="/login">
              Start writing
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ProseParse. Crafted for writers.
          </p>
        </div>
      </footer>
    </>
  )
}
