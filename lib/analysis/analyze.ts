import type { Paragraph } from '@/lib/analysis-data'
import {
  splitParagraphs,
  splitSentences,
  parseDialogueSegments,
  wordsIn,
  bucketFor,
} from './parse'

// Attribution verbs that commonly follow a closing quote.
const ATTRIBUTION_VERBS = new Set([
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

// Match the closing-quote-then-optional-whitespace-then-word pattern.
// This regex is simple and non-backtracking.
const ATTRIBUTION_RE = /[\u201d"]\s*,?\s*(\w+)/g

export type AnalysisPayload = {
  paragraphs: Paragraph[]
  sentenceLengths: { length: number; count: number }[]
  styleMetrics: { label: string; value: string; unit: string }[]
  avgSentenceWords: number
  dialogueTags: { tag: string; count: number }[]
}

export function analyzeManuscript(text: string): AnalysisPayload {
  const paraTexts = splitParagraphs(text)

  // --- per-paragraph annotation ---
  const paragraphs: Paragraph[] = paraTexts.map((paraText, idx) => {
    const segments = parseDialogueSegments(paraText)
    const sentenceTexts = splitSentences(paraText)
    const sentences = sentenceTexts.map((s) => {
      const words = wordsIn(s)
      return { text: s, words, bucket: bucketFor(words) }
    })
    return {
      id: `p${idx + 1}`,
      block: idx,
      segments,
      sentences,
      valence: 0,
      arousal: 0,
    }
  })

  // --- document-level sentence stats ---
  const allSentenceWordCounts: number[] = paragraphs.flatMap(
    (p) => (p.sentences ?? []).map((s) => s.words),
  )

  const totalSentences = allSentenceWordCounts.length
  const totalWords = allSentenceWordCounts.reduce((a, b) => a + b, 0)
  const avgSentenceWords =
    totalSentences > 0 ? Math.round((totalWords / totalSentences) * 10) / 10 : 0

  // Build histogram: { length (bucket label), count }
  // Group by word count, capped at 50 to keep the chart readable.
  const sentenceLengthMap = new Map<number, number>()
  for (const wc of allSentenceWordCounts) {
    const key = Math.min(wc, 50)
    sentenceLengthMap.set(key, (sentenceLengthMap.get(key) ?? 0) + 1)
  }
  const sentenceLengths = Array.from(sentenceLengthMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([length, count]) => ({ length, count }))

  // --- dialogue stats ---
  const verbCounts = new Map<string, number>()
  for (const paraText of paraTexts) {
    for (const match of paraText.matchAll(ATTRIBUTION_RE)) {
      const verb = match[1]?.toLowerCase() ?? ''
      if (ATTRIBUTION_VERBS.has(verb)) {
        verbCounts.set(verb, (verbCounts.get(verb) ?? 0) + 1)
      }
    }
  }
  const dialogueTags = Array.from(verbCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }))

  // Total dialogue characters for dialogue %
  const totalChars = text.replace(/\s/g, '').length
  const dialogueChars = paragraphs
    .flatMap((p) => p.segments.filter((s) => s.kind === 'dialogue').map((s) => s.text.replace(/\s/g, '').length))
    .reduce((a, b) => a + b, 0)
  const dialoguePct = totalChars > 0 ? Math.round((dialogueChars / totalChars) * 100) : 0

  const longestSentence =
    allSentenceWordCounts.length > 0 ? Math.max(...allSentenceWordCounts) : 0

  const styleMetrics = [
    { label: 'Avg. sentence', value: String(avgSentenceWords), unit: 'words' },
    { label: 'Sentences', value: String(totalSentences), unit: 'total' },
    { label: 'Longest', value: String(longestSentence), unit: 'words' },
    { label: 'Dialogue', value: String(dialoguePct), unit: '%' },
  ]

  return {
    paragraphs,
    sentenceLengths,
    styleMetrics,
    avgSentenceWords,
    dialogueTags,
  }
}
