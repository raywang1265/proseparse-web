import { Activity, Waves } from 'lucide-react'

export function PreviewMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/5 blur-2xl" />
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl shadow-black/5">
        {/* window chrome */}
        <div className="flex items-center gap-1.5 border-b border-border/40 px-4 py-3">
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="size-2.5 rounded-full bg-muted-foreground/25" />
          <span className="ml-3 text-xs text-muted-foreground">
            Saltwater — Ch. 12
          </span>
        </div>

        <div className="grid gap-px bg-border/40 sm:grid-cols-[1.3fr_1fr]">
          {/* manuscript side */}
          <div className="bg-card p-5">
            <p className="font-serif text-[0.95rem] leading-[1.8] text-foreground/90">
              The lighthouse held its breath. She pressed her palm to the cold
              glass and{' '}
              <mark className="rounded-md bg-hl-taste px-1 py-0.5 text-hl-taste-foreground">
                tasted salt on the wind
              </mark>
              , the kind that{' '}
              <mark className="rounded-md bg-hl-dialogue px-1 py-0.5 text-hl-dialogue-foreground">
                &ldquo;means a storm,&rdquo; he&apos;d told her once
              </mark>
              , before the water took everything she knew.
            </p>
          </div>

          {/* insight side */}
          <div className="flex flex-col gap-3 bg-card p-5">
            <div className="rounded-2xl border border-border/50 bg-background/40 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="size-3.5 text-chart-1" />
                Tension
              </div>
              <svg viewBox="0 0 120 36" className="h-9 w-full" fill="none">
                <polyline
                  points="0,28 20,24 40,26 60,16 80,18 100,6 120,10"
                  stroke="var(--color-chart-1)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/40 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Waves className="size-3.5 text-chart-2" />
                Sensory mix
              </div>
              <div className="flex items-end gap-1.5">
                {[60, 90, 40, 75, 30].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-md bg-chart-2"
                    style={{ height: `${h * 0.4}px`, opacity: 0.45 + i * 0.12 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
