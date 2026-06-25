import type {
  Paragraph,
  ExpositionPoint,
  CharacterPair,
  DialogueIssue,
} from '@/lib/analysis-data'

// Derived view state shared across the studio UI. Mirrors lib/db/staleness.ts
// but lives here so client components don't import server-only modules.
export type ViewState =
  | 'unanalyzed'
  | 'analyzing'
  | 'fresh'
  | 'stale'
  | 'error'

// Serializable analysis payload passed from the server to the studio. Each
// field maps to a column on analysis_results; any may be null.
export type StudioAnalysis = {
  paragraphs: Paragraph[] | null
  spark: number[] | null
  voiceSplit: { name: string; value: number; fill: string }[] | null
  sentenceLengths: { length: number; count: number }[] | null
  styleMetrics: { label: string; value: string; unit: string }[] | null
  dialogueTags: { tag: string; count: number }[] | null
  tension:
    | { block: number; label: string; valence: number; arousal: number }[]
    | null
  pacing:
    | { section: string; action: number; description: number; dialogue: number }[]
    | null
  exposition: ExpositionPoint[] | null
  sensory: { sense: string; score: number }[] | null
  sensoryAdvice: string | null
  characters: string[] | null
  voiceMatrix: CharacterPair[] | null
  dialogueIssues: DialogueIssue[] | null
}

export type SidebarSession = {
  id: string
  title: string
  dateLabel: string
  words: number
  spark: number[] | null
  viewState: ViewState
}

export type ActiveSession = {
  id: string
  title: string
  text: string
  wordCount: number
  viewState: ViewState
  analysis: StudioAnalysis | null
}
