'use client'

import { useEffect, useRef } from 'react'
import {
  MANUSCRIPT,
  HIGHLIGHT_LEGEND,
  type HighlightKind,
} from '@/lib/analysis-data'
import { cn } from '@/lib/utils'

const HL_BG: Record<HighlightKind, string> = {
  sensory: 'bg-hl-sensory text-hl-sensory-foreground',
  passive: 'bg-hl-passive text-hl-passive-foreground',
  dialogue: 'bg-hl-dialogue text-hl-dialogue-foreground',
  tag: 'bg-hl-tag text-hl-tag-foreground',
}

export type Lens = HighlightKind | 'none'

export function ManuscriptEditor({
  lens,
  onLensChange,
  activeBlock,
  onHoverBlock,
}: {
  lens: Lens
  onLensChange: (l: Lens) => void
  activeBlock: number | null
  onHoverBlock: (b: number | null) => void
}) {
  const refs = useRef<Record<number, HTMLParagraphElement | null>>({})

  // Tether: when a chart node is activated, scroll the matching paragraph in.
  useEffect(() => {
    if (activeBlock == null) return
    const el = refs.current[activeBlock]
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeBlock])

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
      {/* Editor toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-6 py-3">
        <div className="min-w-0">
          <h1 className="truncate font-serif text-lg font-semibold tracking-tight">
            Ch. 12 — The Lighthouse
          </h1>
          <p className="text-xs text-muted-foreground">
            1,840 words · analyzed just now
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Lens
          </span>
          <LensChip
            label="Plain"
            active={lens === 'none'}
            onClick={() => onLensChange('none')}
          />
          {HIGHLIGHT_LEGEND.map((l) => (
            <LensChip
              key={l.kind}
              label={l.label}
              swatch={l.swatch}
              active={lens === l.kind}
              onClick={() => onLensChange(l.kind)}
            />
          ))}
        </div>
      </div>

      {/* Manuscript body */}
      <div className="scroll-thin flex-1 overflow-y-auto">
        <article className="mx-auto max-w-2xl px-6 py-10">
          {MANUSCRIPT.map((p) => {
            const isActive = activeBlock === p.block
            return (
              <p
                key={p.id}
                ref={(el) => {
                  refs.current[p.block] = el
                }}
                onMouseEnter={() => onHoverBlock(p.block)}
                onMouseLeave={() => onHoverBlock(null)}
                className={cn(
                  '-mx-4 mb-5 scroll-mt-6 rounded-2xl px-4 py-2 font-serif text-[1.0625rem] leading-[1.85] text-foreground/90 transition-colors',
                  isActive && 'bg-accent/60 ring-1 ring-primary/20',
                )}
              >
                {p.segments.map((seg, i) => {
                  const highlighted = lens !== 'none' && seg.kind === lens
                  return (
                    <span
                      key={i}
                      className={cn(
                        highlighted &&
                          'rounded-md px-1 py-0.5',
                        highlighted && HL_BG[seg.kind as HighlightKind],
                      )}
                    >
                      {seg.text}
                    </span>
                  )
                })}
              </p>
            )
          })}
          <div className="mt-10 border-t border-dashed border-border pt-6 text-center text-xs text-muted-foreground">
            End of analyzed selection
          </div>
        </article>
      </div>
    </section>
  )
}

function LensChip({
  label,
  swatch,
  active,
  onClick,
}: {
  label: string
  swatch?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
        active
          ? 'border-primary/50 bg-primary/10 text-foreground'
          : 'border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )}
    >
      {swatch && (
        <span className={cn('size-2 rounded-full', swatch)} aria-hidden />
      )}
      {label}
    </button>
  )
}
