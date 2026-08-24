// ---------------------------------------------------------------------------
// Mock analysis data for the "Margin" writing-analysis studio.
// All copy is placeholder and meant to be replaced by real ML output.
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
   *  parsing; absent on legacy seeded data until re-analyzed. */
  sentences?: SentenceSpan[]
  /** -1 (despair) .. 1 (elation) */
  valence: number
  /** 0 (calm) .. 1 (frantic) */
  arousal: number
}

export type Session = {
  id: string
  title: string
  date: string
  words: number
  /** tiny normalized tension series for the sidebar sparkline */
  spark: number[]
  active?: boolean
}

export const SESSIONS: Session[] = [
  {
    id: 's1',
    title: 'Ch. 12 — The Lighthouse',
    date: 'Today, 11:42',
    words: 1840,
    spark: [0.3, 0.42, 0.38, 0.55, 0.7, 0.62, 0.85, 0.94, 0.6, 0.48],
    active: true,
  },
  {
    id: 's2',
    title: 'Ch. 11 — Low Tide',
    date: 'Yesterday',
    words: 2210,
    spark: [0.5, 0.46, 0.6, 0.52, 0.4, 0.35, 0.55, 0.7, 0.5, 0.44],
  },
  {
    id: 's3',
    title: 'Prologue — Saltwater',
    date: 'May 27',
    words: 980,
    spark: [0.2, 0.3, 0.28, 0.4, 0.5, 0.66, 0.6, 0.74, 0.8, 0.7],
  },
  {
    id: 's4',
    title: 'Ch. 9 — The Argument',
    date: 'May 24',
    words: 3120,
    spark: [0.6, 0.72, 0.9, 0.84, 0.95, 0.7, 0.5, 0.62, 0.4, 0.3],
  },
  {
    id: 's5',
    title: 'Scene draft — Harbor',
    date: 'May 21',
    words: 620,
    spark: [0.4, 0.38, 0.42, 0.5, 0.48, 0.52, 0.46, 0.5, 0.55, 0.5],
  },
]

// Manuscript broken into paragraphs. Segments carry highlight kinds so the
// editor can recolor the same text under different "lenses".
export const MANUSCRIPT: Paragraph[] = [
  {
    id: 'p1',
    block: 0,
    valence: 0.1,
    arousal: 0.25,
    segments: [
      { text: 'The ' },
      { text: 'lighthouse stood pale against the bruised sky' },
      { text: ', and the wind ' },
      { text: 'was carried', kind: 'passive' },
      { text: ' inland like a rumor nobody wanted to repeat.' },
    ],
  },
  {
    id: 'p2',
    block: 1,
    valence: -0.2,
    arousal: 0.35,
    segments: [
      { text: 'Mara pressed her palm to the cold glass and listened to the ' },
      { text: 'gulls shrieking over the breakwater' },
      { text: '. ' },
      { text: '"You came back,"', kind: 'dialogue' },
      { text: ' she ' },
      { text: 'said', kind: 'tag' },
      { text: ', not turning around.' },
    ],
  },
  {
    id: 'p3',
    block: 2,
    valence: -0.45,
    arousal: 0.55,
    segments: [
      { text: '"I never really left."', kind: 'dialogue' },
      { text: ' Thomas ' },
      { text: 'muttered', kind: 'tag' },
      { text: ', and the words ' },
      { text: 'were swallowed', kind: 'passive' },
      { text: ' by the ' },
      { text: 'salt-thick air' },
      { text: '.' },
    ],
  },
  {
    id: 'p4',
    block: 3,
    valence: -0.6,
    arousal: 0.72,
    segments: [
      { text: 'The lamp above them ' },
      { text: 'flickered, throwing long amber teeth across the floor' },
      { text: '. Something ' },
      { text: 'had been broken', kind: 'passive' },
      { text: ' here, years ago, and never repaired.' },
    ],
  },
  {
    id: 'p5',
    block: 4,
    valence: -0.75,
    arousal: 0.88,
    segments: [
      { text: '"Don\'t you dare apologize,"', kind: 'dialogue' },
      { text: ' she ' },
      { text: 'snapped', kind: 'tag' },
      { text: '. The ' },
      { text: 'tang of rust and brine' },
      { text: ' filled the narrow room as her voice climbed.' },
    ],
  },
  {
    id: 'p6',
    block: 5,
    valence: -0.5,
    arousal: 0.6,
    segments: [
      { text: 'Thomas reached out. His knuckles ' },
      { text: 'grazed the rough wool of her sleeve' },
      { text: '. ' },
      { text: '"I came to tell you the truth,"', kind: 'dialogue' },
      { text: ' he ' },
      { text: 'offered', kind: 'tag' },
      { text: '.' },
    ],
  },
  {
    id: 'p7',
    block: 6,
    valence: -0.15,
    arousal: 0.4,
    segments: [
      { text: 'For a long moment only the ' },
      { text: 'slow drip of condensation' },
      { text: ' answered him. The storm outside ' },
      { text: 'had been forgotten', kind: 'passive' },
      { text: ' by them both.' },
    ],
  },
  {
    id: 'p8',
    block: 7,
    valence: 0.25,
    arousal: 0.3,
    segments: [
      { text: 'Then she laughed — small, surprised, ' },
      { text: 'bright as a struck match' },
      { text: '. ' },
      { text: '"You always were a terrible liar,"', kind: 'dialogue' },
      { text: ' she ' },
      { text: 'whispered', kind: 'tag' },
      { text: '.' },
    ],
  },
  {
    id: 'p9',
    block: 8,
    valence: 0.4,
    arousal: 0.2,
    segments: [
      { text: 'Outside, the clouds ' },
      { text: 'were pulled apart', kind: 'passive' },
      { text: ' and a thin ribbon of ' },
      { text: 'gold spilled across the water' },
      { text: ', steady and unhurried.' },
    ],
  },
]

// ---- Style & Structure -----------------------------------------------------
export const VOICE_SPLIT = [
  { name: 'Active voice', value: 78, fill: 'var(--color-chart-1)' },
  { name: 'Passive voice', value: 22, fill: 'var(--color-chart-4)' },
]

export const SENTENCE_LENGTHS = [
  { length: 4, count: 2 },
  { length: 6, count: 5 },
  { length: 8, count: 9 },
  { length: 10, count: 14 },
  { length: 12, count: 18 },
  { length: 14, count: 15 },
  { length: 16, count: 11 },
  { length: 18, count: 7 },
  { length: 22, count: 5 },
  { length: 26, count: 3 },
  { length: 32, count: 2 },
]

export const STYLE_METRICS = [
  { label: 'Avg. sentence', value: '14.2', unit: 'words' },
  { label: 'Adverbs', value: '3.1', unit: '%' },
  { label: 'Dialogue tags', value: '18', unit: 'used' },
  { label: 'Readability', value: 'Gr. 7', unit: 'level' },
]

export const DIALOGUE_TAGS = [
  { tag: 'said', count: 9 },
  { tag: 'whispered', count: 4 },
  { tag: 'muttered', count: 3 },
  { tag: 'snapped', count: 2 },
  { tag: 'offered', count: 1 },
]

// ---- Narrative & Pacing ----------------------------------------------------
export const TENSION = MANUSCRIPT.map((p) => ({
  block: p.block,
  label: `¶${p.block + 1}`,
  valence: Number((p.valence * 100).toFixed(0)),
  arousal: Number((p.arousal * 100).toFixed(0)),
}))

export const PACING = [
  { section: 'p. 1', action: 10, description: 60, dialogue: 30 },
  { section: 'p. 2', action: 20, description: 35, dialogue: 45 },
  { section: 'p. 3', action: 35, description: 20, dialogue: 45 },
  { section: 'p. 4', action: 55, description: 25, dialogue: 20 },
  { section: 'p. 5', action: 40, description: 18, dialogue: 42 },
  { section: 'p. 6', action: 15, description: 50, dialogue: 35 },
]

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

const EXPOSITION_SPLIT = [
  { direct: 70, indirect: 30 },
  { direct: 35, indirect: 65 },
  { direct: 20, indirect: 80 },
  { direct: 55, indirect: 45 },
  { direct: 15, indirect: 85 },
  { direct: 25, indirect: 75 },
  { direct: 60, indirect: 40 },
  { direct: 18, indirect: 82 },
  { direct: 48, indirect: 52 },
]

export const EXPOSITION: ExpositionPoint[] = MANUSCRIPT.map((p, i) => {
  const direct = EXPOSITION_SPLIT[i]?.direct ?? 50
  const indirect = EXPOSITION_SPLIT[i]?.indirect ?? 50
  return {
    block: p.block,
    label: `¶${p.block + 1}`,
    kind: direct >= 50 ? 'direct' : 'indirect',
    pDirect: direct / 100,
    direct,
    indirect,
    truncated: false,
  }
})

// ---- Sensory Palette -------------------------------------------------------
export const SENSORY: SensoryScore[] = [
  { sense: 'Sight', score: 40 },
  { sense: 'Sound', score: 20 },
  { sense: 'Touch', score: 20 },
  { sense: 'Smell', score: 20 },
  { sense: 'Taste', score: 0 },
]

/** Seed spans matching the lighthouse sample (paragraph-relative offsets). */
export const SENSORY_SPANS: SensoryHighlightSpan[] = [
  // p1: "lighthouse stood pale against the bruised sky"
  { sense: 'sight', block: 0, start: 4, end: 49 },
  // p2: "cold glass" + "gulls shrieking over the breakwater"
  { sense: 'touch', block: 1, start: 29, end: 39 },
  { sense: 'sound', block: 1, start: 60, end: 95 },
  // p3: "salt-thick air"
  { sense: 'smell', block: 2, start: 76, end: 90 },
  // p4: "flickered, throwing long amber teeth across the floor"
  { sense: 'sight', block: 3, start: 20, end: 73 },
  // p5: "tang of rust and brine"
  { sense: 'smell', block: 4, start: 45, end: 67 },
  // p6: "grazed the rough wool of her sleeve"
  { sense: 'touch', block: 5, start: 33, end: 68 },
  // p7: "slow drip of condensation"
  { sense: 'sound', block: 6, start: 27, end: 52 },
  // p8: "bright as a struck match"
  { sense: 'sight', block: 7, start: 37, end: 61 },
  // p9: "gold spilled across the water"
  { sense: 'sight', block: 8, start: 59, end: 88 },
]

// ---- Character & Dialogue --------------------------------------------------
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

export const CHARACTERS = ['Mara', 'Thomas', 'Eli', 'The Keeper']

export const VOICE_MATRIX: CharacterPair[] = [
  {
    a: 'Mara',
    b: 'Thomas',
    similarity: 0.34,
    semSim: 0.28,
    styleSim: 0.42,
    vocabSim: 0.31,
  },
  {
    a: 'Mara',
    b: 'Eli',
    similarity: 0.71,
    semSim: 0.68,
    styleSim: 0.76,
    vocabSim: 0.62,
  },
  {
    a: 'Mara',
    b: 'The Keeper',
    similarity: 0.19,
    semSim: 0.15,
    styleSim: 0.24,
    vocabSim: 0.18,
  },
  {
    a: 'Thomas',
    b: 'Eli',
    similarity: 0.58,
    semSim: 0.55,
    styleSim: 0.61,
    vocabSim: 0.52,
  },
  {
    a: 'Thomas',
    b: 'The Keeper',
    similarity: 0.27,
    semSim: 0.22,
    styleSim: 0.33,
    vocabSim: 0.25,
  },
  {
    a: 'Eli',
    b: 'The Keeper',
    similarity: 0.83,
    semSim: 0.79,
    styleSim: 0.88,
    vocabSim: 0.81,
  },
]

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    name: 'Mara',
    wordCount: 412,
    sentenceCount: 38,
    avgSentenceLength: 10.8,
    avgWordLength: 4.2,
    lexicalDiversity: 0.48,
    contractionDensity: 0.06,
    questionRate: 0.18,
    exclamationRate: 0.05,
    commaDensity: 0.08,
    dashEllipsisRate: 0.11,
    posRates: [
      { tag: 'PRON', rate: 0.14 },
      { tag: 'NOUN', rate: 0.18 },
      { tag: 'VERB', rate: 0.16 },
      { tag: 'ADJ', rate: 0.07 },
      { tag: 'ADV', rate: 0.09 },
      { tag: 'AUX', rate: 0.06 },
      { tag: 'INTJ', rate: 0.02 },
    ],
    punctuation: [
      { mark: '.', per1k: 92 },
      { mark: ',', per1k: 80 },
      { mark: '?', per1k: 18 },
      { mark: '!', per1k: 5 },
    ],
  },
  {
    name: 'Thomas',
    wordCount: 356,
    sentenceCount: 29,
    avgSentenceLength: 12.3,
    avgWordLength: 4.6,
    lexicalDiversity: 0.52,
    contractionDensity: 0.03,
    questionRate: 0.07,
    exclamationRate: 0.02,
    commaDensity: 0.11,
    dashEllipsisRate: 0.04,
    posRates: [
      { tag: 'PRON', rate: 0.1 },
      { tag: 'NOUN', rate: 0.22 },
      { tag: 'VERB', rate: 0.14 },
      { tag: 'ADJ', rate: 0.09 },
      { tag: 'ADV', rate: 0.06 },
      { tag: 'AUX', rate: 0.05 },
      { tag: 'INTJ', rate: 0.01 },
    ],
    punctuation: [
      { mark: '.', per1k: 81 },
      { mark: ',', per1k: 110 },
      { mark: '?', per1k: 7 },
      { mark: '!', per1k: 2 },
    ],
  },
  {
    name: 'Eli',
    wordCount: 298,
    sentenceCount: 34,
    avgSentenceLength: 8.8,
    avgWordLength: 3.9,
    lexicalDiversity: 0.41,
    contractionDensity: 0.09,
    questionRate: 0.21,
    exclamationRate: 0.12,
    commaDensity: 0.05,
    dashEllipsisRate: 0.15,
    posRates: [
      { tag: 'PRON', rate: 0.18 },
      { tag: 'NOUN', rate: 0.14 },
      { tag: 'VERB', rate: 0.17 },
      { tag: 'ADJ', rate: 0.05 },
      { tag: 'ADV', rate: 0.11 },
      { tag: 'AUX', rate: 0.07 },
      { tag: 'INTJ', rate: 0.04 },
    ],
    punctuation: [
      { mark: '.', per1k: 114 },
      { mark: ',', per1k: 50 },
      { mark: '?', per1k: 21 },
      { mark: '!', per1k: 12 },
    ],
  },
  {
    name: 'The Keeper',
    wordCount: 267,
    sentenceCount: 31,
    avgSentenceLength: 8.6,
    avgWordLength: 4.0,
    lexicalDiversity: 0.39,
    contractionDensity: 0.08,
    questionRate: 0.19,
    exclamationRate: 0.1,
    commaDensity: 0.06,
    dashEllipsisRate: 0.14,
    posRates: [
      { tag: 'PRON', rate: 0.17 },
      { tag: 'NOUN', rate: 0.15 },
      { tag: 'VERB', rate: 0.16 },
      { tag: 'ADJ', rate: 0.06 },
      { tag: 'ADV', rate: 0.1 },
      { tag: 'AUX', rate: 0.07 },
      { tag: 'INTJ', rate: 0.05 },
    ],
    punctuation: [
      { mark: '.', per1k: 116 },
      { mark: ',', per1k: 60 },
      { mark: '?', per1k: 19 },
      { mark: '!', per1k: 10 },
    ],
  },
]

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

export const DIALOGUE_ISSUES: DialogueIssue[] = [
  {
    id: 'd1',
    severity: 'high',
    block: null,
    title: 'Voices too alike',
    detail:
      'Eli and The Keeper score 0.83 combined — similar topics and diction may make them hard to tell apart.',
  },
  {
    id: 'd2',
    severity: 'medium',
    block: null,
    title: 'Voices too alike',
    detail: 'Mara and Eli score 0.71 — overlapping casual diction and question habits.',
  },
  {
    id: 'd3',
    severity: 'low',
    block: null,
    title: 'Unattributed dialogue',
    detail:
      'A small share of dialogue could not be attributed. Clearer speech tags help speaker resolution.',
  },
]

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
