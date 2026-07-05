import type { Paragraph, VoiceTrendPoint } from '@/lib/analysis-data'
import {
  splitParagraphs,
  splitSentences,
  findDialogueSpans,
  findAttributionTagSpans,
  buildSegments,
  wordsIn,
  bucketFor,
  type MarkedSpan,
} from './parse'

export type VoiceCounts = { active: number; passive: number }

export type AnalysisPayload = {
  paragraphs: Paragraph[]
  sentenceLengths: { length: number; count: number }[]
  styleMetrics: { label: string; value: string; unit: string }[]
  avgSentenceWords: number
  dialogueTags: { tag: string; count: number }[]
  voiceTrend: VoiceTrendPoint[]
  voiceSplit: { name: string; value: number; fill: string }[]
  passivePct: number
}

// Parse one paragraph's raw text into an annotated Paragraph using only local
// detection (dialogue quotes + attribution tags + sentence splitting). Used by
// the in-process fallback analyzer; the remote path builds paragraphs from
// backend offsets instead (see lib/analysis/batch.ts).
export function parseParagraph(text: string, block: number): Paragraph {
  const spans: MarkedSpan[] = [
    ...findDialogueSpans(text).map(
      ([start, end]) => ({ start, end, kind: 'dialogue' as const }),
    ),
    ...findAttributionTagSpans(text).map(
      ([start, end]) => ({ start, end, kind: 'tag' as const }),
    ),
  ]
  const segments = buildSegments(text, spans)
  const sentences = splitSentences(text).map((s) => {
    const words = wordsIn(s)
    return { text: s, words, bucket: bucketFor(words) }
  })
  return { id: `p${block + 1}`, block, segments, sentences, valence: 0, arousal: 0 }
}

// Compute all document-level aggregates from already-annotated paragraphs.
// Shared by the local and remote (batched) paths so aggregation lives in one
// place. `voiceByBlock` supplies clause-level active/passive counts from the
// backend; when omitted, passive is derived from passive-kind segments and
// active is treated as 0. Written with plain loops (no array spreads) to stay
// safe for very large manuscripts.
export function aggregateAnalysis(
  paragraphs: Paragraph[],
  voiceByBlock?: Map<number, VoiceCounts>,
): AnalysisPayload {
  let totalSentences = 0
  let totalWords = 0
  let longestSentence = 0
  const sentenceLengthMap = new Map<number, number>()

  let totalChars = 0
  let dialogueChars = 0
  const verbCounts = new Map<string, number>()

  const voiceTrend: VoiceTrendPoint[] = []
  let totalActive = 0
  let totalPassive = 0

  for (const p of paragraphs) {
    for (const s of p.sentences ?? []) {
      totalSentences++
      totalWords += s.words
      if (s.words > longestSentence) longestSentence = s.words
      const key = Math.min(s.words, 50)
      sentenceLengthMap.set(key, (sentenceLengthMap.get(key) ?? 0) + 1)
    }

    let segPassive = 0
    for (const seg of p.segments) {
      const chars = seg.text.replace(/\s/g, '').length
      totalChars += chars
      if (seg.kind === 'dialogue') {
        dialogueChars += chars
      } else if (seg.kind === 'tag') {
        const verb = seg.text.trim().toLowerCase()
        if (verb) verbCounts.set(verb, (verbCounts.get(verb) ?? 0) + 1)
      } else if (seg.kind === 'passive') {
        segPassive++
      }
    }

    const counts = voiceByBlock?.get(p.block) ?? { active: 0, passive: segPassive }
    totalActive += counts.active
    totalPassive += counts.passive
    voiceTrend.push({
      block: p.block,
      label: `¶${p.block + 1}`,
      active: counts.active,
      passive: counts.passive,
    })
  }

  const avgSentenceWords =
    totalSentences > 0 ? Math.round((totalWords / totalSentences) * 10) / 10 : 0

  const sentenceLengths = Array.from(sentenceLengthMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([length, count]) => ({ length, count }))

  const dialogueTags = Array.from(verbCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }))

  const dialoguePct =
    totalChars > 0 ? Math.round((dialogueChars / totalChars) * 100) : 0

  const voiceTotal = totalActive + totalPassive
  const passivePct = voiceTotal > 0 ? Math.round((totalPassive / voiceTotal) * 100) : 0
  const activePct = voiceTotal > 0 ? 100 - passivePct : 0
  const voiceSplit = [
    { name: 'Active', value: activePct, fill: 'var(--color-chart-5)' },
    { name: 'Passive', value: passivePct, fill: 'var(--color-chart-4)' },
  ]

  const styleMetrics = [
    { label: 'Avg. sentence', value: String(avgSentenceWords), unit: 'words' },
    { label: 'Passive', value: String(passivePct), unit: '%' },
    { label: 'Dialogue', value: String(dialoguePct), unit: '%' },
    { label: 'Longest', value: String(longestSentence), unit: 'words' },
  ]

  return {
    paragraphs,
    sentenceLengths,
    styleMetrics,
    avgSentenceWords,
    dialogueTags,
    voiceTrend,
    voiceSplit,
    passivePct,
  }
}

// Local, in-process analysis: split + parse each paragraph, then aggregate.
// No passive/active voice detection is available locally, so voice counts are
// derived from segment kinds (passive segments only; active = 0).
export function analyzeManuscript(text: string): AnalysisPayload {
  const paragraphs = splitParagraphs(text).map((t, i) => parseParagraph(t, i))
  return aggregateAnalysis(paragraphs)
}
