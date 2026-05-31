// ---------------------------------------------------------------------------
// Mock analysis data for the "Margin" writing-analysis studio.
// All copy is placeholder and meant to be replaced by real ML output.
// ---------------------------------------------------------------------------

export type HighlightKind = 'sensory' | 'passive' | 'dialogue' | 'tag'

export type Segment = {
  text: string
  kind?: HighlightKind
}

export type Paragraph = {
  id: string
  /** index used to tether charts <-> text */
  block: number
  segments: Segment[]
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
      { text: 'lighthouse stood pale against the bruised sky', kind: 'sensory' },
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
      { text: 'gulls shrieking over the breakwater', kind: 'sensory' },
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
      { text: 'salt-thick air', kind: 'sensory' },
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
      { text: 'flickered, throwing long amber teeth across the floor', kind: 'sensory' },
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
      { text: 'tang of rust and brine', kind: 'sensory' },
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
      { text: 'grazed the rough wool of her sleeve', kind: 'sensory' },
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
      { text: 'slow drip of condensation', kind: 'sensory' },
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
      { text: 'bright as a struck match', kind: 'sensory' },
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
      { text: 'gold spilled across the water', kind: 'sensory' },
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

// ---- Sensory Palette -------------------------------------------------------
export const SENSORY = [
  { sense: 'Visual', score: 86 },
  { sense: 'Auditory', score: 64 },
  { sense: 'Tactile', score: 48 },
  { sense: 'Olfactory', score: 31 },
  { sense: 'Gustatory', score: 12 },
]

// ---- Character & Dialogue --------------------------------------------------
export type CharacterPair = {
  a: string
  b: string
  similarity: number // 0..1, higher = voices too alike
}

export const CHARACTERS = ['Mara', 'Thomas', 'Eli', 'The Keeper']

export const VOICE_MATRIX: CharacterPair[] = [
  { a: 'Mara', b: 'Thomas', similarity: 0.34 },
  { a: 'Mara', b: 'Eli', similarity: 0.71 },
  { a: 'Mara', b: 'The Keeper', similarity: 0.19 },
  { a: 'Thomas', b: 'Eli', similarity: 0.58 },
  { a: 'Thomas', b: 'The Keeper', similarity: 0.27 },
  { a: 'Eli', b: 'The Keeper', similarity: 0.83 },
]

export type DialogueIssue = {
  id: string
  severity: 'high' | 'medium' | 'low'
  block: number
  title: string
  detail: string
}

export const DIALOGUE_ISSUES: DialogueIssue[] = [
  {
    id: 'd1',
    severity: 'high',
    block: 5,
    title: 'Ambiguous speaker',
    detail: '"I came to tell you the truth" — pronoun "he" could refer to Thomas or Eli.',
  },
  {
    id: 'd2',
    severity: 'medium',
    block: 8,
    title: 'Unclear antecedent',
    detail: '"they both" — three characters were active in the prior paragraph.',
  },
  {
    id: 'd3',
    severity: 'low',
    block: 1,
    title: 'Filter word',
    detail: '"listened to" distances the reader from Mara\'s direct experience.',
  },
]

export const HIGHLIGHT_LEGEND: {
  kind: HighlightKind
  label: string
  swatch: string
}[] = [
  { kind: 'sensory', label: 'Sensory detail', swatch: 'bg-chart-2' },
  { kind: 'passive', label: 'Passive voice', swatch: 'bg-chart-4' },
  { kind: 'dialogue', label: 'Dialogue', swatch: 'bg-chart-1' },
  { kind: 'tag', label: 'Dialogue tags', swatch: 'bg-chart-3' },
]
