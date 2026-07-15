import 'server-only'

import type {
  CharacterPair,
  DialogueAttributionSpan,
  DialogueIssue,
  VoiceProfile,
} from '@/lib/analysis-data'
import { splitParagraphs } from './parse'
import { chunk, type BatchParagraphInput } from './batch'
import {
  analysisAuthHeaders,
  mapPool,
  VOICE_CONCURRENCY,
  warmAnalysisBackend,
  withRetry,
} from './remote'

// Max paragraphs per /voice request. API allows up to 200; 100 balances Cloud
// Run's 60s per-request cap against dialogue-seam UNKNOWN inflation.
export const VOICE_BATCH_SIZE = 100

export const EMBED_DIM = 384

// Characters below this wordCount are dropped from the matrix/charts — style
// rates are too noisy on tiny dialogue samples.
export const MIN_WORDS = 150

/** High-signal POS tags for the style radar and style feature vector. */
export const STYLE_POS_TAGS = [
  'PRON',
  'NOUN',
  'VERB',
  'ADJ',
  'ADV',
  'AUX',
  'INTJ',
] as const

const PUNCT_KEYS = [
  '.',
  ',',
  '!',
  '?',
  ';',
  ':',
  '-',
  "'",
  '"',
  '…',
  '—',
  '–',
] as const

// ---------------------------------------------------------------------------
// Wire contract with POST /voice
// ---------------------------------------------------------------------------

export type VoiceStylometry = {
  sentenceCount: number
  tokenCount: number
  wordCount: number
  charCount: number
  contractionCount: number
  punctuation: Record<string, number>
  posCounts: Record<string, number>
}

export type VoiceCharacter = {
  name: string
  vector: number[]
  stylometry: VoiceStylometry
  uniqueLemmas: string[]
  /** Paragraph-local quote spans; may be omitted on older backend revisions. */
  spans?: DialogueSpan[]
}

export type DialogueSpan = {
  block: number
  span: [number, number]
}

export type VoiceRequest = {
  sessionId?: string | null
  batchIndex: number
  paragraphs: BatchParagraphInput[]
}

export type VoiceResponse = {
  batchIndex: number
  characters: VoiceCharacter[]
}

export type VoiceAnalysisPayload = {
  characters: string[]
  voiceMatrix: CharacterPair[]
  voiceProfiles: VoiceProfile[]
  dialogueIssues: DialogueIssue[]
  /** All attributed + UNKNOWN dialogue spans for read-mode highlighting. */
  speakerSpans: DialogueAttributionSpan[]
}

// ---------------------------------------------------------------------------
// Accumulator
// ---------------------------------------------------------------------------

type Acc = {
  vectorSum: Float64Array
  vectorWeight: number
  sentenceCount: number
  tokenCount: number
  wordCount: number
  charCount: number
  contractionCount: number
  punctuation: Record<string, number>
  posCounts: Record<string, number>
  lemmas: Set<string>
  spans: DialogueAttributionSpan[]
}

type UnknownBucket = {
  wordCount: number
  tokenCount: number
  spans: DialogueAttributionSpan[]
}

function emptyPunctuation(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const k of PUNCT_KEYS) out[k] = 0
  return out
}

function createAcc(): Acc {
  return {
    vectorSum: new Float64Array(EMBED_DIM),
    vectorWeight: 0,
    sentenceCount: 0,
    tokenCount: 0,
    wordCount: 0,
    charCount: 0,
    contractionCount: 0,
    punctuation: emptyPunctuation(),
    posCounts: {},
    lemmas: new Set(),
    spans: [],
  }
}

function appendSpans(
  dest: DialogueAttributionSpan[],
  speaker: string,
  spans: DialogueSpan[] | undefined,
) {
  for (const s of spans ?? []) {
    const [start, end] = s.span
    if (end > start) {
      dest.push({ speaker, block: s.block, start, end })
    }
  }
}

function mergeCharacter(acc: Acc, ch: VoiceCharacter) {
  const { stylometry: s, vector, uniqueLemmas } = ch
  const weight = Math.max(0, s.wordCount ?? 0)

  if (vector.length === EMBED_DIM && weight > 0) {
    for (let i = 0; i < EMBED_DIM; i++) {
      acc.vectorSum[i] += weight * vector[i]
    }
    acc.vectorWeight += weight
  }

  acc.sentenceCount += s.sentenceCount ?? 0
  acc.tokenCount += s.tokenCount ?? 0
  acc.wordCount += s.wordCount ?? 0
  acc.charCount += s.charCount ?? 0
  acc.contractionCount += s.contractionCount ?? 0

  for (const k of PUNCT_KEYS) {
    acc.punctuation[k] = (acc.punctuation[k] ?? 0) + (s.punctuation?.[k] ?? 0)
  }
  for (const [tag, count] of Object.entries(s.posCounts ?? {})) {
    acc.posCounts[tag] = (acc.posCounts[tag] ?? 0) + count
  }
  for (const lemma of uniqueLemmas ?? []) {
    acc.lemmas.add(lemma)
  }
  appendSpans(acc.spans, ch.name, ch.spans)
}

// ---------------------------------------------------------------------------
// Derived rates + similarity
// ---------------------------------------------------------------------------

type DerivedRates = {
  avgSentenceLength: number
  avgWordLength: number
  lexicalDiversity: number
  contractionDensity: number
  questionRate: number
  exclamationRate: number
  commaDensity: number
  dashEllipsisRate: number
  posRates: { tag: string; rate: number }[]
  punctuation: { mark: string; per1k: number }[]
  styleFeatures: number[]
}

function deriveRates(acc: Acc): DerivedRates {
  const words = Math.max(acc.wordCount, 1)
  const sents = Math.max(acc.sentenceCount, 1)

  const avgSentenceLength = acc.wordCount / sents
  const avgWordLength = acc.charCount / words
  const lexicalDiversity = acc.lemmas.size / words
  const contractionDensity = acc.contractionCount / words
  const questionRate = (acc.punctuation['?'] ?? 0) / sents
  const exclamationRate = (acc.punctuation['!'] ?? 0) / sents
  const commaDensity = (acc.punctuation[','] ?? 0) / words
  const dashEllipsisRate =
    ((acc.punctuation['—'] ?? 0) + (acc.punctuation['…'] ?? 0)) / sents

  // Prefer wordCount for POS rates (handoff): alphabetic dialogue volume.
  const posRates = STYLE_POS_TAGS.map((tag) => ({
    tag,
    rate: (acc.posCounts[tag] ?? 0) / words,
  }))

  const punctuation = PUNCT_KEYS.map((mark) => ({
    mark,
    per1k: ((acc.punctuation[mark] ?? 0) / words) * 1000,
  }))

  const styleFeatures = [
    avgSentenceLength,
    avgWordLength,
    lexicalDiversity,
    contractionDensity,
    questionRate,
    exclamationRate,
    commaDensity,
    dashEllipsisRate,
    ...posRates.map((p) => p.rate),
  ]

  return {
    avgSentenceLength,
    avgWordLength,
    lexicalDiversity,
    contractionDensity,
    questionRate,
    exclamationRate,
    commaDensity,
    dashEllipsisRate,
    posRates,
    punctuation,
    styleFeatures,
  }
}

function finalizeVector(acc: Acc): Float64Array {
  const unit = new Float64Array(EMBED_DIM)
  const w = Math.max(acc.vectorWeight, 1e-9)
  let normSq = 0
  for (let i = 0; i < EMBED_DIM; i++) {
    const v = acc.vectorSum[i] / w
    unit[i] = v
    normSq += v * v
  }
  const norm = Math.sqrt(normSq)
  if (norm > 0) {
    for (let i = 0; i < EMBED_DIM; i++) unit[i] /= norm
  }
  return unit
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function round2(x: number): number {
  return Math.round(x * 100) / 100
}

function cosineUnit(a: Float64Array, b: Float64Array): number {
  let dot = 0
  for (let i = 0; i < EMBED_DIM; i++) dot += a[i] * b[i]
  return clamp01(dot)
}

function euclidean(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i]
    sum += d * d
  }
  return Math.sqrt(sum)
}

/** Z-score each feature dimension across the cast. Single-character cast → zeros. */
function zScoreColumns(rows: number[][]): number[][] {
  const n = rows.length
  if (n === 0) return []
  const dims = rows[0].length
  const means = new Array(dims).fill(0)
  const stds = new Array(dims).fill(0)

  for (const row of rows) {
    for (let d = 0; d < dims; d++) means[d] += row[d]
  }
  for (let d = 0; d < dims; d++) means[d] /= n

  for (const row of rows) {
    for (let d = 0; d < dims; d++) {
      const diff = row[d] - means[d]
      stds[d] += diff * diff
    }
  }
  for (let d = 0; d < dims; d++) {
    stds[d] = Math.sqrt(stds[d] / n)
  }

  return rows.map((row) =>
    row.map((v, d) => (stds[d] > 1e-12 ? (v - means[d]) / stds[d] : 0)),
  )
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0
  let inter = 0
  for (const x of a) {
    if (b.has(x)) inter++
  }
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

function toProfile(name: string, acc: Acc, rates: DerivedRates): VoiceProfile {
  return {
    name,
    wordCount: acc.wordCount,
    sentenceCount: acc.sentenceCount,
    avgSentenceLength: round2(rates.avgSentenceLength),
    avgWordLength: round2(rates.avgWordLength),
    lexicalDiversity: round2(rates.lexicalDiversity),
    contractionDensity: round2(rates.contractionDensity),
    questionRate: round2(rates.questionRate),
    exclamationRate: round2(rates.exclamationRate),
    commaDensity: round2(rates.commaDensity),
    dashEllipsisRate: round2(rates.dashEllipsisRate),
    posRates: rates.posRates.map((p) => ({
      tag: p.tag,
      rate: round2(p.rate),
    })),
    punctuation: rates.punctuation
      .filter((p) => p.per1k > 0)
      .map((p) => ({ mark: p.mark, per1k: round2(p.per1k) })),
  }
}

function buildClarityNotes(
  matrix: CharacterPair[],
  unknown: UnknownBucket,
  totalKnownWords: number,
): DialogueIssue[] {
  const issues: DialogueIssue[] = []
  let id = 0

  for (const pair of matrix) {
    if (pair.similarity >= 0.8) {
      issues.push({
        id: `voice-${++id}`,
        severity: 'high',
        block: null,
        title: 'Voices too alike',
        detail: `${pair.a} and ${pair.b} score ${pair.similarity.toFixed(2)} combined — similar topics and diction may make them hard to tell apart.`,
      })
    } else if (pair.similarity >= 0.65) {
      issues.push({
        id: `voice-${++id}`,
        severity: 'medium',
        block: null,
        title: 'Voices too alike',
        detail: `${pair.a} and ${pair.b} score ${pair.similarity.toFixed(2)} — overlapping diction or themes.`,
      })
    }
  }

  if (unknown.wordCount > 0) {
    const denom = unknown.wordCount + totalKnownWords
    const share = denom > 0 ? unknown.wordCount / denom : 0
    issues.push({
      id: `voice-${++id}`,
      severity: share > 0.15 ? 'high' : share > 0.05 ? 'medium' : 'low',
      block: null,
      title: 'Unattributed dialogue',
      detail: `About ${Math.round(share * 100)}% of dialogue words could not be attributed. Use Speakers → Unattributed in read mode to highlight them, or add clearer speech tags.`,
    })
  }

  return issues
}

function collectSpeakerSpans(
  byName: Map<string, Acc>,
  unknown: UnknownBucket,
): DialogueAttributionSpan[] {
  const out: DialogueAttributionSpan[] = []
  for (const acc of byName.values()) {
    out.push(...acc.spans)
  }
  out.push(...unknown.spans)
  return out
}

function finalizeAggregates(
  byName: Map<string, Acc>,
  unknown: UnknownBucket,
): VoiceAnalysisPayload {
  const speakerSpans = collectSpeakerSpans(byName, unknown)
  const entries = [...byName.entries()]
    .filter(([, acc]) => acc.wordCount >= MIN_WORDS)
    .sort((a, b) => b[1].wordCount - a[1].wordCount)

  if (entries.length === 0) {
    return {
      characters: [],
      voiceMatrix: [],
      voiceProfiles: [],
      dialogueIssues: buildClarityNotes([], unknown, 0),
      speakerSpans,
    }
  }

  const names = entries.map(([name]) => name)
  const vectors = entries.map(([, acc]) => finalizeVector(acc))
  const ratesList = entries.map(([, acc]) => deriveRates(acc))
  const zStyles = zScoreColumns(ratesList.map((r) => r.styleFeatures))

  const voiceProfiles = entries.map(([name, acc], i) =>
    toProfile(name, acc, ratesList[i]),
  )

  const voiceMatrix: CharacterPair[] = []
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const semSim = cosineUnit(vectors[i], vectors[j])
      const styleSim = 1 / (1 + euclidean(zStyles[i], zStyles[j]))
      const vocabSim = jaccard(entries[i][1].lemmas, entries[j][1].lemmas)
      const similarity = round2(0.5 * semSim + 0.4 * styleSim + 0.1 * vocabSim)
      voiceMatrix.push({
        a: names[i],
        b: names[j],
        similarity,
        semSim: round2(semSim),
        styleSim: round2(styleSim),
        vocabSim: round2(vocabSim),
      })
    }
  }

  const totalKnownWords = entries.reduce((sum, [, acc]) => sum + acc.wordCount, 0)

  return {
    characters: names,
    voiceMatrix,
    voiceProfiles,
    dialogueIssues: buildClarityNotes(voiceMatrix, unknown, totalKnownWords),
    speakerSpans,
  }
}

// ---------------------------------------------------------------------------
// Remote orchestration
// ---------------------------------------------------------------------------

async function fetchVoiceBatchOnce(
  baseUrl: string,
  req: VoiceRequest,
): Promise<VoiceResponse> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/voice`, {
    method: 'POST',
    headers: analysisAuthHeaders(),
    body: JSON.stringify(req),
    cache: 'no-store',
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `Voice backend responded ${res.status} for batch ${req.batchIndex}: ${detail}`,
    )
  }

  return (await res.json()) as VoiceResponse
}

async function fetchVoiceBatch(
  baseUrl: string,
  req: VoiceRequest,
): Promise<VoiceResponse> {
  return withRetry(`POST /voice batch ${req.batchIndex}`, () =>
    fetchVoiceBatchOnce(baseUrl, req),
  )
}

/**
 * Batched remote voice extraction: split into paragraphs, call POST /voice
 * with a small concurrency pool (default 1 — MiniLM is heavy), aggregate per
 * character, then compute combined similarity + profiles.
 */
export async function analyzeVoicesRemote(
  text: string,
  opts: { sessionId?: string } = {},
): Promise<VoiceAnalysisPayload> {
  const baseUrl = process.env.ANALYSIS_API_URL
  if (!baseUrl) throw new Error('ANALYSIS_API_URL is not configured')

  const inputs: BatchParagraphInput[] = splitParagraphs(text).map((t, block) => ({
    block,
    text: t,
  }))

  if (inputs.length === 0) {
    return {
      characters: [],
      voiceMatrix: [],
      voiceProfiles: [],
      dialogueIssues: [],
      speakerSpans: [],
    }
  }

  // analyzeManuscriptRemote already warms; this is a no-op-ish second ping when
  // voice runs after analyze, and critical when voice is called alone.
  await warmAnalysisBackend(baseUrl)

  const batches = chunk(inputs, VOICE_BATCH_SIZE)
  const byName = new Map<string, Acc>()
  const unknown: UnknownBucket = { wordCount: 0, tokenCount: 0, spans: [] }

  const responses = await mapPool(batches, VOICE_CONCURRENCY, (paragraphs, batchIndex) =>
    fetchVoiceBatch(baseUrl, {
      sessionId: opts.sessionId,
      batchIndex,
      paragraphs,
    }),
  )

  for (const response of responses) {
    for (const ch of response.characters) {
      if (ch.name === 'UNKNOWN') {
        unknown.wordCount += ch.stylometry.wordCount ?? 0
        unknown.tokenCount += ch.stylometry.tokenCount ?? 0
        appendSpans(unknown.spans, 'UNKNOWN', ch.spans)
        continue
      }
      let acc = byName.get(ch.name)
      if (!acc) {
        acc = createAcc()
        byName.set(ch.name, acc)
      }
      mergeCharacter(acc, ch)
    }
  }

  return finalizeAggregates(byName, unknown)
}
