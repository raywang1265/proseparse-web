'use client'

import { useEffect, useRef } from 'react'
import { Check, Pencil, BookOpen, Loader2, AlertCircle } from 'lucide-react'
import {
  HIGHLIGHT_LEGEND,
  type HighlightKind,
  type Paragraph,
  type SentenceBucket,
} from '@/lib/analysis-data'
import { cn } from '@/lib/utils'
import { EditableTitle } from './editable-title'
import type { ViewState } from './types'
import type { SaveState } from './workspace'

const HL_BG: Record<HighlightKind, string> = {
  sensory: 'bg-hl-sensory text-hl-sensory-foreground',
  passive: 'bg-hl-passive text-hl-passive-foreground',
  dialogue: 'bg-hl-dialogue text-hl-dialogue-foreground',
  tag: 'bg-hl-tag text-hl-tag-foreground',
}

const SENTENCE_BG: Record<SentenceBucket, string | null> = {
  short: 'bg-hl-sentence-short text-hl-sentence-short-foreground',
  medium: null,
  long: 'bg-hl-sentence-long text-hl-sentence-long-foreground',
}

export type Lens = HighlightKind | 'none' | 'sentence-length'

function countWords(text: string): number {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

export function ManuscriptEditor({
  sessionId,
  title,
  viewState,
  mode,
  onModeChange,
  text,
  onTextChange,
  saveState,
  paragraphs,
  lens,
  onLensChange,
  activeBlock,
  scrollToBlock,
  onHoverBlock,
}: {
  sessionId: string
  title: string
  wordCount: number
  viewState: ViewState
  mode: 'read' | 'edit'
  onModeChange: (m: 'read' | 'edit') => void
  text: string
  onTextChange: (t: string) => void
  saveState: SaveState
  paragraphs: Paragraph[] | null
  lens: Lens
  onLensChange: (l: Lens) => void
  activeBlock: number | null
  scrollToBlock: number | null
  onHoverBlock: (b: number | null) => void
}) {
  const refs = useRef<Record<number, HTMLParagraphElement | null>>({})

  // Highlights are only valid against a fresh analysis snapshot. Any other
  // state (stale / unanalyzed / analyzing / error) forces the plain editor.
  const canRead = viewState === 'fresh' && !!paragraphs?.length
  const effectiveMode = canRead ? mode : 'edit'

  // Only scroll when the chart drove the selection (scrollToBlock), not when
  // the user is already hovering the paragraph they want to see.
  useEffect(() => {
    if (effectiveMode !== 'read' || scrollToBlock == null) return
    refs.current[scrollToBlock]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [scrollToBlock, effectiveMode])

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-6 py-3">
        <div className="min-w-0">
          <EditableTitle
            sessionId={sessionId}
            title={title}
            className="max-w-full font-serif text-lg font-semibold tracking-tight"
          />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {countWords(text).toLocaleString()} words
            <span className="size-0.5 rounded-full bg-muted-foreground/50" />
            <SaveIndicator saveState={saveState} viewState={viewState} />
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {effectiveMode === 'read' && (
            <div className="mr-1 flex items-center gap-1.5">
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
              <LensChip
                label="Sentence length"
                swatch="bg-hl-sentence-long"
                active={lens === 'sentence-length'}
                onClick={() => onLensChange('sentence-length')}
              />
            </div>
          )}

          {/* Read/Edit toggle — Read is only available with a fresh analysis. */}
          <div className="flex items-center rounded-full border border-border p-0.5">
            <ModeButton
              icon={BookOpen}
              label="Read"
              active={effectiveMode === 'read'}
              disabled={!canRead}
              title={
                canRead
                  ? 'Read with highlights'
                  : 'Re-analyze to view highlights'
              }
              onClick={() => onModeChange('read')}
            />
            <ModeButton
              icon={Pencil}
              label="Edit"
              active={effectiveMode === 'edit'}
              onClick={() => onModeChange('edit')}
            />
          </div>
        </div>
      </div>

      {effectiveMode === 'read' ? (
        <div className="scroll-thin flex-1 overflow-y-auto">
          <article className="mx-auto max-w-2xl px-6 py-10">
            {paragraphs!.map((p) => {
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
                  {lens === 'sentence-length' && p.sentences?.length
                    ? p.sentences.map((s, i) => {
                        const bg = SENTENCE_BG[s.bucket]
                        return (
                          <span
                            key={i}
                            className={cn(bg && 'rounded-md px-1 py-0.5', bg ?? undefined)}
                          >
                            {s.text}{' '}
                          </span>
                        )
                      })
                    : p.segments.map((seg, i) => {
                        const highlighted =
                          lens !== 'none' &&
                          lens !== 'sentence-length' &&
                          seg.kind === lens
                        return (
                          <span
                            key={i}
                            className={cn(
                              highlighted && 'rounded-md px-1 py-0.5',
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
      ) : (
        <div className="flex-1 overflow-hidden">
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Start writing or paste a draft here…"
            spellCheck
            className="scroll-thin h-full w-full resize-none bg-background px-6 py-10 font-serif text-[1.0625rem] leading-[1.85] text-foreground/90 outline-none placeholder:text-muted-foreground/60 [&]:mx-auto"
            style={{ maxWidth: 'none' }}
          />
        </div>
      )}
    </section>
  )
}

function SaveIndicator({
  saveState,
  viewState,
}: {
  saveState: SaveState
  viewState: ViewState
}) {
  if (saveState === 'saving')
    return (
      <span className="inline-flex items-center gap-1">
        <Loader2 className="size-3 animate-spin" />
        Saving…
      </span>
    )
  if (saveState === 'error')
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <AlertCircle className="size-3" />
        Save failed
      </span>
    )
  if (saveState === 'saved')
    return (
      <span className="inline-flex items-center gap-1">
        <Check className="size-3" />
        Saved
      </span>
    )
  if (viewState === 'stale') return <span className="text-chart-4">Edited · analysis out of date</span>
  if (viewState === 'unanalyzed') return <span>Not analyzed yet</span>
  if (viewState === 'fresh') return <span>Analyzed</span>
  return <span>&nbsp;</span>
}

function ModeButton({
  icon: Icon,
  label,
  active,
  disabled,
  title,
  onClick,
}: {
  icon: typeof BookOpen
  label: string
  active: boolean
  disabled?: boolean
  title?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        active
          ? 'bg-primary/10 text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
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
