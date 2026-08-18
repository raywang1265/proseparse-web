import 'server-only'

import type { SensoryHighlightSpan, SensoryScore, Sense } from '@/lib/analysis-data'
import { SENSES } from '@/lib/analysis-data'
import { splitParagraphs } from './parse'
import { chunk, type BatchParagraphInput, type Offset } from './batch'
import {
  analysisAuthHeaders,
  mapPool,
  SENSORY_CONCURRENCY,
  warmAnalysisBackend,
  withRetry,
} from './remote'

/** Max paragraphs per /sensory request — same cap as /analyze; do not raise. */
export const SENSORY_BATCH_SIZE = 20

export { SENSES, type Sense }

export const SENSE_LABELS: Record<Sense, string> = {
  sight: 'Sight',
  sound: 'Sound',
  touch: 'Touch',
  smell: 'Smell',
  taste: 'Taste',
}

// ---------------------------------------------------------------------------
// Wire contract with POST /sensory
// ---------------------------------------------------------------------------

export type SensoryRequest = {
  sessionId?: string | null
  batchIndex: number
  paragraphs: BatchParagraphInput[]
}

export type SensoryParagraphResult = {
  block: number
  sight: Offset[]
  sound: Offset[]
  touch: Offset[]
  smell: Offset[]
  taste: Offset[]
  counts: Record<Sense, number>
}

export type SensoryResponse = {
  batchIndex: number
  results: SensoryParagraphResult[]
}

export type SensoryAnalysisPayload = {
  spans: SensoryHighlightSpan[]
  scores: SensoryScore[]
  advice: string | null
}

// ---------------------------------------------------------------------------
// Aggregation helpers
// ---------------------------------------------------------------------------

function emptyCounts(): Record<Sense, number> {
  return { sight: 0, sound: 0, touch: 0, smell: 0, taste: 0 }
}

function flattenSpans(results: SensoryParagraphResult[]): SensoryHighlightSpan[] {
  const spans: SensoryHighlightSpan[] = []
  for (const r of results) {
    for (const sense of SENSES) {
      for (const [start, end] of r[sense] ?? []) {
        if (end > start) {
          spans.push({ sense, block: r.block, start, end })
        }
      }
    }
  }
  return spans
}

function sumCounts(results: SensoryParagraphResult[]): Record<Sense, number> {
  const totals = emptyCounts()
  for (const r of results) {
    const c = r.counts ?? emptyCounts()
    for (const sense of SENSES) {
      // Prefer explicit counts; fall back to span length if counts omitted.
      const n = c[sense] ?? r[sense]?.length ?? 0
      totals[sense] += n
    }
  }
  return totals
}

/** Share of total hits per sense (0–100). All zeros when nothing detected. */
export function countsToScores(totals: Record<Sense, number>): SensoryScore[] {
  const total = SENSES.reduce((sum, s) => sum + totals[s], 0)
  return SENSES.map((sense) => ({
    sense: SENSE_LABELS[sense],
    score: total === 0 ? 0 : Math.round((totals[sense] / total) * 100),
  }))
}

/**
 * One coaching line when the mix is lopsided: a dominant sense (≥60% of hits)
 * and at least one sense with zero hits.
 */
export function buildSensoryAdvice(scores: SensoryScore[]): string | null {
  const totalPct = scores.reduce((sum, s) => sum + s.score, 0)
  if (totalPct === 0) return null

  const dominant = scores.reduce((a, b) => (b.score > a.score ? b : a))
  const missing = scores.filter((s) => s.score === 0).map((s) => s.sense)

  if (dominant.score < 60 || missing.length === 0) return null

  const missingList =
    missing.length === 1
      ? missing[0].toLowerCase()
      : missing.length === 2
        ? `${missing[0].toLowerCase()} and ${missing[1].toLowerCase()}`
        : `${missing.slice(0, -1).map((m) => m.toLowerCase()).join(', ')}, and ${missing[missing.length - 1].toLowerCase()}`

  return `${dominant.sense} dominates this passage (${dominant.score}%). Consider grounding a moment with ${missingList} detail to balance the sensory palette.`
}

function finalize(results: SensoryParagraphResult[]): SensoryAnalysisPayload {
  const spans = flattenSpans(results)
  const scores = countsToScores(sumCounts(results))
  return {
    spans,
    scores,
    advice: buildSensoryAdvice(scores),
  }
}

// ---------------------------------------------------------------------------
// Remote orchestration
// ---------------------------------------------------------------------------

async function fetchSensoryBatchOnce(
  baseUrl: string,
  req: SensoryRequest,
): Promise<SensoryResponse> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/sensory`, {
    method: 'POST',
    headers: analysisAuthHeaders(),
    body: JSON.stringify(req),
    cache: 'no-store',
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `Sensory backend responded ${res.status} for batch ${req.batchIndex}: ${detail}`,
    )
  }

  return (await res.json()) as SensoryResponse
}

async function fetchSensoryBatch(
  baseUrl: string,
  req: SensoryRequest,
): Promise<SensoryResponse> {
  return withRetry(`POST /sensory batch ${req.batchIndex}`, () =>
    fetchSensoryBatchOnce(baseUrl, req),
  )
}

/**
 * Batched remote sensory extraction: split into paragraphs, call POST /sensory
 * with concurrency 1 (MiniLM), flatten spans by block, and derive radar scores.
 */
export async function analyzeSensoryRemote(
  text: string,
  opts: { sessionId?: string } = {},
): Promise<SensoryAnalysisPayload> {
  const baseUrl = process.env.ANALYSIS_API_URL
  if (!baseUrl) throw new Error('ANALYSIS_API_URL is not configured')

  const inputs: BatchParagraphInput[] = splitParagraphs(text).map((t, block) => ({
    block,
    text: t,
  }))

  if (inputs.length === 0) {
    return { spans: [], scores: countsToScores(emptyCounts()), advice: null }
  }

  await warmAnalysisBackend(baseUrl)

  const batches = chunk(inputs, SENSORY_BATCH_SIZE)
  const responses = await mapPool(
    batches,
    SENSORY_CONCURRENCY,
    (paragraphs, batchIndex) =>
      fetchSensoryBatch(baseUrl, {
        sessionId: opts.sessionId,
        batchIndex,
        paragraphs,
      }),
  )

  // Index by block; do not assume response array order matches document order.
  const byBlock = new Map<number, SensoryParagraphResult>()
  for (const response of responses) {
    for (const r of response.results) {
      byBlock.set(r.block, r)
    }
  }

  const ordered = [...byBlock.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, r]) => r)

  return finalize(ordered)
}
