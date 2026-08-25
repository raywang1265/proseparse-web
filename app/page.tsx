import { SiteNav } from '@/components/landing/site-nav'
import { Welcome } from '@/components/landing/welcome'

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col text-foreground">
      <SiteNav />
      <Welcome />
    </main>
  )
}
