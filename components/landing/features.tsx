import { Activity, GitGraph, Mic, Sparkles, Waves, Layers } from 'lucide-react'

const FEATURES = [
  {
    icon: Activity,
    title: 'Tension curve',
    body: 'Watch dramatic pressure rise and fall across every scene, so slow stretches surface before a reader ever notices them.',
  },
  {
    icon: GitGraph,
    title: 'Pacing & exposition',
    body: 'See the balance of action, description, and dialogue — plus how much you show versus tell, paragraph by paragraph.',
  },
  {
    icon: Mic,
    title: 'Voice fingerprint',
    body: 'Compare how distinct each character sounds and catch dialogue that blurs together into a single voice.',
  },
  {
    icon: Waves,
    title: 'Sensory palette',
    body: 'A radar of sight, sound, touch, taste, and smell reveals which senses you lean on and which go quiet.',
  },
  {
    icon: Layers,
    title: 'Tethered to the text',
    body: 'Every datapoint links back to the exact line. Click a spike on the chart and the manuscript scrolls to meet it.',
  },
  {
    icon: Sparkles,
    title: 'Re-analyze on demand',
    body: 'Revise a passage and refresh — the whole picture updates so you can edit against the data, not against a hunch.',
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20 lg:py-28">
      <div className="max-w-2xl">
        <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Craft instincts, made visible.
        </h2>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
          ProseParse turns the things great editors feel into something you can
          actually look at — without ever rewriting your sentences for you.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-3xl border border-border/50 bg-card/60 p-6 transition-colors hover:border-border"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <f.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-serif text-lg font-semibold tracking-tight text-foreground">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
