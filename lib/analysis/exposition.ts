import 'server-only'

import type { ExpositionPoint } from '@/lib/analysis-data'
import { splitParagraphs } from './parse'
import { chunk, type BatchParagraphInput } from './batch'
import {
  analysisAuthHeaders,
  EXPOSITION_CONCURRENCY,
  mapPool,
  warmAnalysisBackend,
  withRetry,
} from './remote'

/** Max paragraphs per /exposition request — same cap as /analyze; do not raise. */
export const EXPOSITION_BATCH_SIZE = 20

/** API rejects paragraphs over this length with 413; skip rather than retry as-is. */
const MAX_PARAGRAPH_CHARS = 100_000

/** Cloud Run timeout is 120s (cold start + model load); 180s is safer. */
const FETCH_TIMEOUT_MS = 180_000

// ---------------------------------------------------------------------------
// Wire contract with POST /exposition
// ---------------------------------------------------------------------------

export type ExpositionRequest = {
  sessionId?: string | null
  batchIndex: number
  paragraphs: BatchParagraphInput[]
}

export type ExpositionResult = {
  block: number
  label: 'direct' | 'indirect'
  pDirect: number
  directShare: number
  truncated: boolean
}

export type ExpositionResponse = {
  batchIndex: number
  results: ExpositionResult[]
}

export type ExpositionAnalysisPayload = {
  points: ExpositionPoint[]
}

function toPoint(r: ExpositionResult): ExpositionPoint {
  const direct = r.directShare
  const kind = r.label === 'direct' ? 'direct' : 'indirect'
  return {
    block: r.block,
    label: `¶${r.block + 1}`,
    kind,
    pDirect: r.pDirect,
    direct,
    indirect: 100 - direct,
    truncated: r.truncated,
  }
}

// ---------------------------------------------------------------------------
// Remote orchestration
// ---------------------------------------------------------------------------

async function fetchExpositionBatchOnce(
  baseUrl: string,
  req: ExpositionRequest,
): Promise<ExpositionResponse> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/exposition`, {
    method: 'POST',
    headers: analysisAuthHeaders(),
    body: JSON.stringify(req),
    cache: 'no-store',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `Exposition backend responded ${res.status} for batch ${req.batchIndex}: ${detail}`,
    )
  }

  return (await res.json()) as ExpositionResponse
}

async function fetchExpositionBatch(
  baseUrl: string,
  req: ExpositionRequest,
): Promise<ExpositionResponse> {
  return withRetry(`POST /exposition batch ${req.batchIndex}`, () =>
    fetchExpositionBatchOnce(baseUrl, req),
  )
}

/**
 * Batched remote show/tell classification: split into paragraphs, call
 * POST /exposition with concurrency 4, reassemble by block.
 */
export async function analyzeExpositionRemote(
  text: string,
  opts: { sessionId?: string } = {},
): Promise<ExpositionAnalysisPayload> {
  const baseUrl = process.env.ANALYSIS_API_URL
  if (!baseUrl) throw new Error('ANALYSIS_API_URL is not configured')

  const inputs: BatchParagraphInput[] = []
  for (const [block, paragraph] of splitParagraphs(text).entries()) {
    if (paragraph.length > MAX_PARAGRAPH_CHARS) {
      console.warn(
        `[analysis] skipping exposition paragraph block ${block}: ${paragraph.length} chars > ${MAX_PARAGRAPH_CHARS}`,
      )
      continue
    }
    inputs.push({ block, text: paragraph })
  }

  if (inputs.length === 0) {
    return { points: [] }
  }

  await warmAnalysisBackend(baseUrl)

  const batches = chunk(inputs, EXPOSITION_BATCH_SIZE)
  const responses = await mapPool(
    batches,
    EXPOSITION_CONCURRENCY,
    (paragraphs, batchIndex) =>
      fetchExpositionBatch(baseUrl, {
        sessionId: opts.sessionId,
        batchIndex,
        paragraphs,
      }),
  )

  const byBlock = new Map<number, ExpositionResult>()
  for (const response of responses) {
    for (const r of response.results) {
      byBlock.set(r.block, r)
    }
  }

  const points = [...byBlock.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, r]) => toPoint(r))

  return { points }
}
