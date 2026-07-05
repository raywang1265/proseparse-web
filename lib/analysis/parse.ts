import type { HighlightKind, Segment, SentenceBucket } from '@/lib/analysis-data'

// ---------------------------------------------------------------------------
// Paragraph splitting
// ---------------------------------------------------------------------------

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Sentence splitting (linear single-pass, O(n))
//
// Strategy: walk character by character; when we see a sentence-terminal
// (. ! ?) that is NOT part of an abbreviation or decimal, record a break.
// Trailing closing quotes/parentheses stay with the sentence that ended.
//
// Abbreviation guard: don't break if the period is preceded by a single
// capital letter (e.g. "J. K. Rowling") or a known abbreviation suffix, OR
// if it's followed immediately by a lowercase letter (mid-sentence decimal /
// abbreviation like "e.g. or "Mr.").
// ---------------------------------------------------------------------------

const CLOSING = new Set(['"', '\u201d', ')', ']', '\u2019'])

export function splitSentences(text: string): string[] {
  const sentences: string[] = []
  let start = 0
  let i = 0
  const len = text.length

  while (i < len) {
    const ch = text[i]

    if (ch === '.' || ch === '!' || ch === '?') {
      // Consume a run of terminal punctuation (e.g. "?!" or "...")
      let end = i
      while (end < len && (text[end] === '.' || text[end] === '!' || text[end] === '?')) {
        end++
      }

      // Consume any trailing closing quotes/parens that belong to this sentence
      while (end < len && CLOSING.has(text[end])) {
        end++
      }

      // Look ahead past whitespace to see what follows
      let peek = end
      while (peek < len && text[peek] === ' ') peek++

      const nextChar = peek < len ? text[peek] : ''

      // Don't break if this looks like an abbreviation:
      // - period followed immediately by a lowercase letter without space (e.g. "e.g.")
      // - single capital letter before the period (e.g. "J.")
      if (ch === '.') {
        const prevChar = i > 0 ? text[i - 1] : ''
        const isSingleCapital = /[A-Z]/.test(prevChar) && (i < 2 || !/[a-z]/.test(text[i - 2]))
        const isLowerContinuation = /[a-z]/.test(nextChar) && end === i + 1
        if (isSingleCapital || isLowerContinuation) {
          i = end
          continue
        }
      }

      // A real sentence end requires what follows to be uppercase, a quote
      // opener, digit, or end of string
      const isRealEnd =
        nextChar === '' ||
        /[A-Z\u201c"\u2018'0-9(]/.test(nextChar)

      if (isRealEnd) {
        const sentence = text.slice(start, end).trim()
        if (sentence) sentences.push(sentence)
        start = end
        // skip whitespace between sentences
        while (start < len && text[start] === ' ') start++
        i = start
        continue
      }

      i = end
      continue
    }

    i++
  }

  // Remainder after the last terminal punctuation (or entire text if no terminals found)
  const remainder = text.slice(start).trim()
  if (remainder) sentences.push(remainder)

  return sentences
}

// ---------------------------------------------------------------------------
// Offset spans -> segments
//
// The analysis backend returns char offsets (per-paragraph-relative) for
// passive constructions and dialogue-attribution tags. Dialogue quote spans are
// detected locally. `buildSegments` merges any set of marked [start, end) spans
// with the paragraph text into an ordered, non-overlapping Segment[] whose
// concatenated text equals the original paragraph exactly.
// ---------------------------------------------------------------------------

export type MarkedSpan = { start: number; end: number; kind: HighlightKind }

// Lower number = higher priority when two spans start at the same index.
const KIND_PRIORITY: Record<HighlightKind, number> = {
  dialogue: 0,
  tag: 1,
  passive: 2,
  active: 3,
  sensory: 4,
}

export function buildSegments(text: string, spans: MarkedSpan[]): Segment[] {
  const len = text.length

  const cleaned = spans
    .map((s) => ({
      start: Math.max(0, Math.min(s.start, len)),
      end: Math.max(0, Math.min(s.end, len)),
      kind: s.kind,
    }))
    .filter((s) => s.end > s.start)
    .sort(
      (a, b) =>
        a.start - b.start ||
        KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind] ||
        b.end - a.end,
    )

  const segments: Segment[] = []
  let cursor = 0

  for (const s of cleaned) {
    // Skip spans that overlap one already emitted (first/higher-priority wins).
    if (s.start < cursor) continue
    if (s.start > cursor) segments.push({ text: text.slice(cursor, s.start) })
    segments.push({ text: text.slice(s.start, s.end), kind: s.kind })
    cursor = s.end
  }

  if (cursor < len) segments.push({ text: text.slice(cursor) })

  return segments.filter((seg) => seg.text.length > 0)
}

// ---------------------------------------------------------------------------
// Dialogue quote spans (detected locally — the backend does not return these)
//
// Single-pass pairing of opening and closing quotation marks (straight " and
// curly \u201c/\u201d). Each returned span [start, end) covers the quotation
// marks and the text between them.
// ---------------------------------------------------------------------------

export function findDialogueSpans(text: string): Array<[number, number]> {
  const spans: Array<[number, number]> = []
  let inDialogue = false
  let start = 0

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\u201c') {
      if (!inDialogue) {
        inDialogue = true
        start = i
      }
    } else if (ch === '\u201d') {
      if (inDialogue) {
        spans.push([start, i + 1])
        inDialogue = false
      }
    } else if (ch === '"') {
      if (!inDialogue) {
        inDialogue = true
        start = i
      } else {
        spans.push([start, i + 1])
        inDialogue = false
      }
    }
  }

  if (inDialogue) spans.push([start, text.length])
  return spans
}

// Convenience: local dialogue-only segmentation (used by the in-process
// fallback analyzer and anywhere a quick quote split is needed).
export function parseDialogueSegments(text: string): Segment[] {
  const spans: MarkedSpan[] = findDialogueSpans(text).map(([start, end]) => ({
    start,
    end,
    kind: 'dialogue',
  }))
  return buildSegments(text, spans)
}

// ---------------------------------------------------------------------------
// Attribution tags (dialogue verbs following a closing quote)
//
// Used locally by the in-process fallback analyzer. When the remote backend is
// active, tag spans come from the backend instead.
// ---------------------------------------------------------------------------

export const ATTRIBUTION_VERBS = new Set([
  'said', 'say', 'says',
  'asked', 'ask',
  'replied', 'reply', 'replies',
  'answered', 'answer',
  'whispered', 'whisper',
  'muttered', 'mutter',
  'snapped', 'snap',
  'shouted', 'shout',
  'called', 'call',
  'cried', 'cry',
  'offered', 'offer',
  'added', 'add',
  'continued', 'continue',
  'insisted', 'insist',
  'laughed', 'laugh',
  'sighed', 'sigh',
  'began', 'begin',
  'demanded', 'demand',
])

// Matches a closing quote, optional comma/space, then a word. Non-backtracking.
const ATTRIBUTION_RE = /[\u201d"]\s*,?\s*(\w+)/g

export function findAttributionTagSpans(text: string): Array<[number, number]> {
  const spans: Array<[number, number]> = []
  for (const m of text.matchAll(ATTRIBUTION_RE)) {
    const verb = m[1]?.toLowerCase() ?? ''
    if (!ATTRIBUTION_VERBS.has(verb)) continue
    const wordStart = (m.index ?? 0) + m[0].length - m[1].length
    spans.push([wordStart, wordStart + m[1].length])
  }
  return spans
}

// ---------------------------------------------------------------------------
// Word counting
// ---------------------------------------------------------------------------

export function wordsIn(text: string): number {
  const t = text.trim()
  return t ? t.split(/\s+/).length : 0
}

// ---------------------------------------------------------------------------
// Sentence length bucket
// Short: < 9 words, Long: >= 25 words, Medium: everything in between.
// ---------------------------------------------------------------------------

export function bucketFor(words: number): SentenceBucket {
  if (words < 9) return 'short'
  if (words >= 25) return 'long'
  return 'medium'
}
