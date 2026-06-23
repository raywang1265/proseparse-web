const LENSES = [
  {
    name: 'Sensory detail',
    swatch: 'bg-hl-sensory',
    text: 'tasted salt on the wind',
  },
  {
    name: 'Passive voice',
    swatch: 'bg-hl-passive',
    text: 'the door was opened slowly',
  },
  {
    name: 'Dialogue',
    swatch: 'bg-hl-dialogue',
    text: '“means a storm,” he said',
  },
  {
    name: 'Dialogue tags',
    swatch: 'bg-hl-tag',
    text: 'she whispered, breathless',
  },
]

export function Lenses() {
  return (
    <section id="lenses" className="border-y border-border/40 bg-card/30">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Highlight lenses for close reading.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Flip a lens and ProseParse paints the same passage a new way —
            isolating sensory language, passive constructions, dialogue, or
            speech tags so patterns jump off the page.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {LENSES.map((l) => (
            <div
              key={l.name}
              className="flex items-center gap-4 rounded-2xl border border-border/50 bg-background/50 p-4"
            >
              <span className={`size-3 shrink-0 rounded-full ${l.swatch}`} />
              <span className="w-32 shrink-0 text-sm font-medium text-foreground">
                {l.name}
              </span>
              <span className="truncate font-serif text-sm italic text-muted-foreground">
                {l.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
