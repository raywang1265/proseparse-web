// ---------------------------------------------------------------------------
// Shared types and UI constants for the writing-analysis studio.
// This is the contract between the UI and the analysis layer.
// ---------------------------------------------------------------------------

export type HighlightKind = 'passive' | 'active' | 'dialogue' | 'tag'

/** Five senses returned by POST /sensory (highlight + radar keys). */
export const SENSES = ['sight', 'sound', 'touch', 'smell', 'taste'] as const
export type Sense = (typeof SENSES)[number]

export type SensoryScore = { sense: string; score: number }

/** Paragraph-relative UTF-16 span for a single sensory cue. */
export type SensoryHighlightSpan = {
  sense: Sense
  block: number
  start: number
  end: number
}

export type Segment = {
  text: string
  kind?: HighlightKind
}

// Per-paragraph active/passive voice counts, for the voice trend line chart.
// `block` mirrors Paragraph.block so the chart can tether to the editor.
export type VoiceTrendPoint = {
  block: number
  label: string
  active: number
  passive: number
}

export type SentenceBucket = 'short' | 'medium' | 'long'

export type SentenceSpan = {
  text: string
  words: number
  bucket: SentenceBucket
}

export type Paragraph = {
  id: string
  /** index used to tether charts <-> text */
  block: number
  segments: Segment[]
  /** Sentence-level spans for the sentence-length lens. Populated by heuristic
   *  parsing; absent on older analysis rows until re-analyzed. */
  sentences?: SentenceSpan[]
  /** -1 (despair) .. 1 (elation) */
  valence: number
  /** 0 (calm) .. 1 (frantic) */
  arousal: number
}

// Direct exposition = information stated outright by the narrator (telling).
// Indirect exposition = information revealed through action, dialogue, and
// sensory implication (showing). Aligned to manuscript blocks so the chart can
// be tethered to the editor. `direct` is rendered as a negative value to create
// a diverging bar around a zero baseline.
export type ExpositionPoint = {
  block: number
  label: string // "¶n" for the chart x-axis (not the classifier class)
  kind: 'direct' | 'indirect'
  pDirect: number // 0..1 softmax P(direct)
  direct: number // 0..100 share of the paragraph that "tells"
  indirect: number // 0..100 share that "shows"
  truncated: boolean // classifier only saw the first 384 tokens
}

export type CharacterPair = {
  a: string
  b: string
  /** Combined voice similarity: 0.5·sem + 0.4·style + 0.1·vocab. Higher = voices too alike. */
  similarity: number
  semSim?: number
  styleSim?: number
  vocabSim?: number
}

export type VoiceProfile = {
  name: string
  wordCount: number
  sentenceCount: number
  avgSentenceLength: number
  avgWordLength: number
  lexicalDiversity: number
  contractionDensity: number
  questionRate: number
  exclamationRate: number
  commaDensity: number
  dashEllipsisRate: number
  /** Fixed-order POS rates for the style radar chart. */
  posRates: { tag: string; rate: number }[]
  punctuation: { mark: string; per1k: number }[]
}

export type DialogueIssue = {
  id: string
  severity: 'high' | 'medium' | 'low'
  /** Paragraph index when tethered; null for document-level voice notes. */
  block: number | null
  title: string
  detail: string
}

/** Paragraph-local dialogue quote from POST /voice (UTF-16 offsets). */
export type DialogueAttributionSpan = {
  speaker: string
  block: number
  start: number
  end: number
}

/** User-facing labels for spaCy POS tags shown in the Voice tab. */
export const POS_LABELS: Record<string, string> = {
  PRON: 'Pronoun',
  NOUN: 'Noun',
  PROPN: 'Proper noun',
  VERB: 'Verb',
  ADJ: 'Adjective',
  ADV: 'Adverb',
  AUX: 'Auxiliary',
  INTJ: 'Interjection',
}

export const HIGHLIGHT_LEGEND: {
  kind: HighlightKind
  label: string
  swatch: string
}[] = [
  { kind: 'dialogue', label: 'Dialogue', swatch: 'bg-chart-1' },
  { kind: 'tag', label: 'Dialogue tags', swatch: 'bg-chart-3' },
]

export const SENSE_LEGEND: {
  sense: Sense
  label: string
  swatch: string
}[] = [
  { sense: 'sight', label: 'Sight', swatch: 'bg-chart-2' },
  { sense: 'sound', label: 'Sound', swatch: 'bg-chart-3' },
  { sense: 'touch', label: 'Touch', swatch: 'bg-chart-1' },
  { sense: 'smell', label: 'Smell', swatch: 'bg-chart-5' },
  { sense: 'taste', label: 'Taste', swatch: 'bg-chart-4' },
]
