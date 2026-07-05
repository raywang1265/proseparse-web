import type { Segment, SentenceBucket } from '@/lib/analysis-data'

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
// Dialogue segment parsing
//
// Single-pass pairing of opening and closing quotation marks (straight " and
// curly \u201c/\u201d). Within a paragraph, each open quote starts a dialogue
// segment; the matching close quote ends it. Unmatched quotes (e.g. a straight
// " acting as both open and close in alternating style) are handled by
// toggling state on every straight-quote encounter.
// ---------------------------------------------------------------------------

export function parseDialogueSegments(text: string): Segment[] {
  const segments: Segment[] = []
  let buf = ''
  let inDialogue = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (ch === '\u201c') {
      // Curly open quote — always starts dialogue
      if (buf) segments.push(inDialogue ? { text: buf, kind: 'dialogue' } : { text: buf })
      buf = ch
      inDialogue = true
    } else if (ch === '\u201d') {
      // Curly close quote — always ends dialogue
      buf += ch
      segments.push({ text: buf, kind: 'dialogue' })
      buf = ''
      inDialogue = false
    } else if (ch === '"') {
      // Straight quote — toggle
      if (!inDialogue) {
        if (buf) segments.push({ text: buf })
        buf = ch
        inDialogue = true
      } else {
        buf += ch
        segments.push({ text: buf, kind: 'dialogue' })
        buf = ''
        inDialogue = false
      }
    } else {
      buf += ch
    }
  }

  if (buf) {
    segments.push(inDialogue ? { text: buf, kind: 'dialogue' } : { text: buf })
  }

  return segments.filter((s) => s.text.length > 0)
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
