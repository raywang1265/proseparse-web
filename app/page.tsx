import { SiteNav } from '@/components/landing/site-nav'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { Lenses } from '@/components/landing/lenses'
import { Closing } from '@/components/landing/closing'

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <SiteNav />
      <Hero />
      <Features />
      <Lenses />
      <Closing />
    </main>
  )
}
