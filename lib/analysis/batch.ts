import 'server-only'

import type { Paragraph } from '@/lib/analysis-data'
import {
  splitParagraphs,
  splitSentences,
  findDialogueSpans,
  buildSegments,
  wordsIn,
  bucketFor,
  type MarkedSpan,
} from './parse'
import {
  aggregateAnalysis,
  type AnalysisPayload,
  type VoiceCounts,
} from './analyze'
import {
  ANALYZE_CONCURRENCY,
  analysisAuthHeaders,
  mapPool,
  warmAnalysisBackend,
  withRetry,
} from './remote'

// Max paragraphs sent to the analysis backend in a single request. Tail batches
// may be smaller. Kept small so each request is bounded regardless of manuscript
// size — a 100k-word draft simply fans out into more batches.
export const BATCH_SIZE = 20

// ---------------------------------------------------------------------------
// Wire contract with the FastAPI analysis backend (offset-based, minimal egress)
//
// Ingress (paragraph text) is cheap; egress is billed on Cloud Run, so the
// backend returns ONLY char offsets + clause counts. It does not echo text,
// sentences, or dialogue spans — those are handled locally.
// ---------------------------------------------------------------------------

// [start, end) character offset, relative to a single paragraph's text.
export type Offset = [number, number]

export type BatchParagraphInput = {
  block: number
  text: string
}

export type AnalyzeBatchRequest = {
  sessionId?: string
  batchIndex: number
  paragraphs: BatchParagraphInput[]
}

export type AnalyzedParagraphResult = {
  block: number
  // Passive-construction spans (aux + past participle), paragraph-relative.
  passive: Offset[]
  // Active-voice verb-clause spans, paragraph-relative. Both active and passive
  // spans are highlightable inline by the "Voice" lens.
  active: Offset[]
  // Dialogue-attribution verb spans (e.g. "said"), paragraph-relative.
  tags: Offset[]
  // Clause-level tallies for this paragraph. Optional: when omitted, the counts
  // are derived from the number of active/passive spans.
  counts?: VoiceCounts
}

export type AnalyzeBatchResponse = {
  batchIndex: number
  results: AnalyzedParagraphResult[]
}

// ---------------------------------------------------------------------------

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

// Merge backend offsets (passive + tags) with locally-detected dialogue spans
// and local sentence splitting to produce a fully-annotated Paragraph.
function toParagraph(block: number, text: string, result: AnalyzedParagraphResult): Paragraph {
  const spans: MarkedSpan[] = [
    ...findDialogueSpans(text).map(
      ([start, end]) => ({ start, end, kind: 'dialogue' as const }),
    ),
    ...result.tags.map(([start, end]) => ({ start, end, kind: 'tag' as const })),
    ...result.passive.map(([start, end]) => ({ start, end, kind: 'passive' as const })),
    ...result.active.map(([start, end]) => ({ start, end, kind: 'active' as const })),
  ]
  const segments = buildSegments(text, spans)
  const sentences = splitSentences(text).map((s) => {
    const words = wordsIn(s)
    return { text: s, words, bucket: bucketFor(words) }
  })
  return { id: `p${block + 1}`, block, segments, sentences, valence: 0, arousal: 0 }
}

async function fetchBatchOnce(
  baseUrl: string,
  req: AnalyzeBatchRequest,
): Promise<AnalyzeBatchResponse> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/analyze`, {
    method: 'POST',
    headers: analysisAuthHeaders(),
    body: JSON.stringify(req),
    cache: 'no-store',
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `Analysis backend responded ${res.status} for batch ${req.batchIndex}: ${detail}`,
    )
  }

  return (await res.json()) as AnalyzeBatchResponse
}

async function fetchBatch(
  baseUrl: string,
  req: AnalyzeBatchRequest,
): Promise<AnalyzeBatchResponse> {
  return withRetry(`POST /analyze batch ${req.batchIndex}`, () =>
    fetchBatchOnce(baseUrl, req),
  )
}

// True when a remote analysis backend is configured. When false, callers should
// fall back to the in-process `analyzeManuscript`.
export function hasRemoteBackend(): boolean {
  return !!process.env.ANALYSIS_API_URL
}

// Batched, remote analysis: split into paragraphs, run a small concurrency pool
// against Cloud Run (not all-at-once), reassemble in document order, then run
// the shared document-level aggregation locally.
export async function analyzeManuscriptRemote(
  text: string,
  opts: { sessionId?: string } = {},
): Promise<AnalysisPayload> {
  const baseUrl = process.env.ANALYSIS_API_URL
  if (!baseUrl) throw new Error('ANALYSIS_API_URL is not configured')

  const inputs: BatchParagraphInput[] = splitParagraphs(text).map((t, block) => ({
    block,
    text: t,
  }))

  if (inputs.length === 0) return aggregateAnalysis([])

  await warmAnalysisBackend(baseUrl)

  const batches = chunk(inputs, BATCH_SIZE)

  const responses = await mapPool(batches, ANALYZE_CONCURRENCY, (paragraphs, batchIndex) =>
    fetchBatch(baseUrl, { sessionId: opts.sessionId, batchIndex, paragraphs }),
  )

  const textByBlock = new Map(inputs.map((i) => [i.block, i.text]))
  const results = responses
    .flatMap((r) => r.results)
    .sort((a, b) => a.block - b.block)

  const paragraphs: Paragraph[] = results.map((r) =>
    toParagraph(r.block, textByBlock.get(r.block) ?? '', r),
  )
  const voiceByBlock = new Map<number, VoiceCounts>(
    results.map((r) => [
      r.block,
      r.counts ?? { active: r.active.length, passive: r.passive.length },
    ]),
  )

  return aggregateAnalysis(paragraphs, voiceByBlock)
}
