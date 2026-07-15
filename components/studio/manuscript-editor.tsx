'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Check, Pencil, BookOpen, Loader2, AlertCircle } from 'lucide-react'
import {
  HIGHLIGHT_LEGEND,
  type DialogueAttributionSpan,
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
  active: 'bg-hl-active text-hl-active-foreground',
  dialogue: 'bg-hl-dialogue text-hl-dialogue-foreground',
  tag: 'bg-hl-tag text-hl-tag-foreground',
}

const SENTENCE_BG: Record<SentenceBucket, string | null> = {
  short: 'bg-hl-sentence-short text-hl-sentence-short-foreground',
  medium: null,
  long: 'bg-hl-sentence-long text-hl-sentence-long-foreground',
}

const SPEAKER_SWATCHES = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-5',
  'bg-chart-4',
] as const

const SPEAKER_HL = [
  'bg-chart-1/35 text-foreground',
  'bg-chart-2/35 text-foreground',
  'bg-chart-3/30 text-foreground',
  'bg-chart-5/35 text-foreground',
  'bg-chart-4/30 text-foreground',
] as const

// Kinds highlighted together by the combined active/passive lens.
const GRAMMAR_VOICE_KINDS: HighlightKind[] = ['active', 'passive']

export type Lens = HighlightKind | 'none' | 'sentence-length' | 'voice'

/** Speakers sub-panel — separate from style lenses so chips stay uncrowded. */
export type SpeakerLens =
  | 'off'
  | 'unattributed'
  | 'all'
  | { speaker: string }

function countWords(text: string): number {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

function paragraphPlainText(p: Paragraph): string {
  return p.segments.map((s) => s.text).join('')
}

function shortSpeaker(name: string) {
  return name === 'UNKNOWN' ? 'Unattributed' : name.split(' ')[0]
}

function speakerColorIndex(name: string, cast: string[]): number {
  const i = cast.indexOf(name)
  return i >= 0 ? i % SPEAKER_HL.length : 0
}

function matchesSpeakerLens(
  speaker: string,
  lens: SpeakerLens,
): boolean {
  if (lens === 'off') return false
  if (lens === 'unattributed') return speaker === 'UNKNOWN'
  if (lens === 'all') return true
  return speaker === lens.speaker
}

type PaintedChunk = {
  text: string
  speaker?: string
}

function paintSpeakerChunks(
  text: string,
  spans: DialogueAttributionSpan[],
  lens: SpeakerLens,
): PaintedChunk[] {
  const relevant = spans
    .filter((s) => matchesSpeakerLens(s.speaker, lens))
    .map((s) => ({
      start: Math.max(0, Math.min(s.start, text.length)),
      end: Math.max(0, Math.min(s.end, text.length)),
      speaker: s.speaker,
    }))
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const chunks: PaintedChunk[] = []
  let cursor = 0
  for (const s of relevant) {
    if (s.start < cursor) continue
    if (s.start > cursor) chunks.push({ text: text.slice(cursor, s.start) })
    chunks.push({ text: text.slice(s.start, s.end), speaker: s.speaker })
    cursor = s.end
  }
  if (cursor < text.length) chunks.push({ text: text.slice(cursor) })
  return chunks.filter((c) => c.text.length > 0)
}

function isSpeakerLensActive(lens: SpeakerLens): boolean {
  return lens !== 'off'
}

function speakerLensEquals(a: SpeakerLens, b: SpeakerLens): boolean {
  if (a === b) return true
  if (typeof a === 'object' && typeof b === 'object') {
    return a.speaker === b.speaker
  }
  return false
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
  speakerLens,
  onSpeakerLensChange,
  speakerSpans,
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
  speakerLens: SpeakerLens
  onSpeakerLensChange: (l: SpeakerLens) => void
  speakerSpans: DialogueAttributionSpan[] | null
  activeBlock: number | null
  scrollToBlock: number | null
  onHoverBlock: (b: number | null) => void
}) {
  const refs = useRef<Record<number, HTMLParagraphElement | null>>({})

  const canRead = viewState === 'fresh' && !!paragraphs?.length
  const effectiveMode = canRead ? mode : 'edit'

  const spans = speakerSpans ?? []
  const hasSpeakerData = spans.length > 0

  const castNames = useMemo(() => {
    const seen = new Set<string>()
    const names: string[] = []
    for (const s of spans) {
      if (s.speaker === 'UNKNOWN' || seen.has(s.speaker)) continue
      seen.add(s.speaker)
      names.push(s.speaker)
    }
    return names
  }, [spans])

  const hasUnknown = useMemo(
    () => spans.some((s) => s.speaker === 'UNKNOWN'),
    [spans],
  )

  const spansByBlock = useMemo(() => {
    const map = new Map<number, DialogueAttributionSpan[]>()
    for (const s of spans) {
      const list = map.get(s.block) ?? []
      list.push(s)
      map.set(s.block, list)
    }
    return map
  }, [spans])

  useEffect(() => {
    if (effectiveMode !== 'read' || scrollToBlock == null) return
    refs.current[scrollToBlock]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [scrollToBlock, effectiveMode])

  function selectStyleLens(next: Lens) {
    onLensChange(next)
    if (isSpeakerLensActive(speakerLens)) onSpeakerLensChange('off')
  }

  function selectSpeakerLens(next: SpeakerLens) {
    onSpeakerLensChange(next)
    if (isSpeakerLensActive(next) && lens !== 'none') onLensChange('none')
  }

  const speakersActive = isSpeakerLensActive(speakerLens)

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

      {effectiveMode === 'read' && (
        <div className="flex flex-col gap-2 border-b border-border/40 px-6 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Lens
            </span>
            <LensChip
              label="Plain"
              active={!speakersActive && lens === 'none'}
              onClick={() => selectStyleLens('none')}
            />
            {HIGHLIGHT_LEGEND.map((l) => (
              <LensChip
                key={l.kind}
                label={l.label}
                swatch={l.swatch}
                active={!speakersActive && lens === l.kind}
                onClick={() => selectStyleLens(l.kind)}
              />
            ))}
            <LensChip
              label="Active / passive"
              swatch="bg-hl-active"
              active={!speakersActive && lens === 'voice'}
              onClick={() => selectStyleLens('voice')}
            />
            <LensChip
              label="Sentence length"
              swatch="bg-hl-sentence-long"
              active={!speakersActive && lens === 'sentence-length'}
              onClick={() => selectStyleLens('sentence-length')}
            />
          </div>

          {hasSpeakerData ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Speakers
              </span>
              <LensChip
                label="Off"
                active={speakerLens === 'off'}
                onClick={() => selectSpeakerLens('off')}
              />
              {hasUnknown ? (
                <LensChip
                  label="Unattributed"
                  swatch="bg-hl-unknown"
                  active={speakerLens === 'unattributed'}
                  onClick={() => selectSpeakerLens('unattributed')}
                />
              ) : null}
              <LensChip
                label="All speakers"
                active={speakerLens === 'all'}
                onClick={() => selectSpeakerLens('all')}
              />
              {castNames.map((name, i) => (
                <LensChip
                  key={name}
                  label={shortSpeaker(name)}
                  swatch={SPEAKER_SWATCHES[i % SPEAKER_SWATCHES.length]}
                  active={speakerLensEquals(speakerLens, { speaker: name })}
                  onClick={() => selectSpeakerLens({ speaker: name })}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}

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
                  {speakersActive
                    ? paintSpeakerChunks(
                        paragraphPlainText(p),
                        spansByBlock.get(p.block) ?? [],
                        speakerLens,
                      ).map((chunk, i) => {
                        const highlighted = !!chunk.speaker
                        const hlClass =
                          chunk.speaker === 'UNKNOWN'
                            ? 'bg-hl-unknown text-hl-unknown-foreground'
                            : SPEAKER_HL[
                                speakerColorIndex(chunk.speaker!, castNames)
                              ]
                        return (
                          <span
                            key={i}
                            title={
                              chunk.speaker
                                ? shortSpeaker(chunk.speaker)
                                : undefined
                            }
                            className={cn(
                              highlighted && 'rounded-md px-1 py-0.5',
                              highlighted && hlClass,
                            )}
                          >
                            {chunk.text}
                          </span>
                        )
                      })
                    : lens === 'sentence-length' && p.sentences?.length
                      ? p.sentences.map((s, i) => {
                          const bg = SENTENCE_BG[s.bucket]
                          return (
                            <span
                              key={i}
                              className={cn(
                                bg && 'rounded-md px-1 py-0.5',
                                bg ?? undefined,
                              )}
                            >
                              {s.text}{' '}
                            </span>
                          )
                        })
                      : p.segments.map((seg, i) => {
                          const highlighted =
                            lens === 'voice'
                              ? !!seg.kind &&
                                GRAMMAR_VOICE_KINDS.includes(seg.kind)
                              : lens !== 'none' &&
                                lens !== 'sentence-length' &&
                                seg.kind === lens
                          return (
                            <span
                              key={i}
                              className={cn(
                                highlighted && 'rounded-md px-1 py-0.5',
                                highlighted &&
                                  HL_BG[seg.kind as HighlightKind],
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
  if (viewState === 'stale')
    return <span className="text-chart-4">Edited · analysis out of date</span>
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
