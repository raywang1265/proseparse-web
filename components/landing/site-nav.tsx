import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/components/studio/theme-toggle'
import { Button } from '@/components/ui/button'

export function SiteNav() {
  return (
    <header className="border-b border-border/40">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
        <Link href="/" aria-label="ProseParse home">
          <Logo />
        </Link>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <Link href="/studio">Open studio</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
