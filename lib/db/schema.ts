import {
  pgTable,
  text,
  timestamp,
  integer,
  pgEnum,
  jsonb,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import type { Paragraph, ExpositionPoint } from '@/lib/analysis-data'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const sessionStatusEnum = pgEnum('session_status', [
  'pending',    // created/edited, no current analysis
  'analyzing',  // ML job in progress
  'done',       // analysis complete
  'error',      // analysis failed
])

// ---------------------------------------------------------------------------
// Staleness model
// ---------------------------------------------------------------------------
// `manuscriptText` is the editable source of truth. An analysis is computed
// against one frozen snapshot of that text, and is only valid while the text
// is unchanged. We track this with two hashes:
//
//   sessions.contentHash              = hash(current manuscriptText)
//   analysisResults.analyzedTextHash  = contentHash captured at analysis time
//
// isStale := session.contentHash !== analysis.analyzedTextHash
//
// Stale analyses are kept (not deleted) so that reverting an edit back to the
// analyzed text makes the analysis valid again. The UI must NEVER project a
// stale analysis onto the live text — when stale, the editor renders plain
// text and insights are shown dimmed/"out of date". `status` tracks the
// processing lifecycle only; staleness is always derived from the hashes.


// ---------------------------------------------------------------------------
// users
// Keyed by Firebase UID so we never need a separate auth table — Firebase
// owns identity, Neon owns app data.
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Firebase UID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// sessions
// Each session is one "analysis run" — a title, the raw manuscript text the
// user submitted, and processing metadata.
// ---------------------------------------------------------------------------

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(), // nanoid / cuid generated app-side
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    manuscriptText: text('manuscript_text').notNull().default(''),
    // Hash of the current manuscriptText; recomputed on every (autosaved) edit.
    // Compared against analysisResults.analyzedTextHash to detect staleness.
    contentHash: text('content_hash').notNull(),
    wordCount: integer('word_count').notNull().default(0),
    status: sessionStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Bumped on every edit (autosave) — drives "last edited" in the sidebar.
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
)

// ---------------------------------------------------------------------------
// analysis_results
// One row per completed analysis run. Stores the full ML output as typed
// JSONB columns — one per insight category — so the UI can consume them
// directly with the same shapes defined in lib/analysis-data.ts.
//
// Column types use `jsonb` with TypeScript generics matching the existing
// data types so the app layer stays fully typed end-to-end.
// ---------------------------------------------------------------------------

// Spark series: small normalized tension array used by the session sidebar.
type SparkSeries = number[]

// Style output
type VoiceSplit = { name: string; value: number; fill: string }[]
type SentenceLengths = { length: number; count: number }[]
type StyleMetric = { label: string; value: string; unit: string }
type DialogueTag = { tag: string; count: number }

// Narrative / pacing output
type TensionPoint = { block: number; label: string; valence: number; arousal: number }
type PacingPoint = { section: string; action: number; description: number; dialogue: number }

// Sensory output
type SensoryScore = { sense: string; score: number }[]

// Character / voice output
type CharacterPair = { a: string; b: string; similarity: number }
type DialogueIssue = {
  id: string
  severity: 'high' | 'medium' | 'low'
  block: number
  title: string
  detail: string
}

export const analysisResults = pgTable(
  'analysis_results',
  {
    id: text('id').primaryKey(),
    // One current analysis per session (1:1). "Re-analyze" overwrites this row.
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    // The session.contentHash this analysis was computed against. When it no
    // longer matches the session's current contentHash, this analysis is stale.
    analyzedTextHash: text('analyzed_text_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

    // ---- Annotated manuscript -----------------------------------------
    // Paragraphs with segment highlight annotations (sensory / passive /
    // dialogue / tag), valence, and arousal — the core manuscript data.
    paragraphs: jsonb('paragraphs').$type<Paragraph[]>(),

    // ---- Sidebar spark series -----------------------------------------
    spark: jsonb('spark').$type<SparkSeries>(),

    // ---- Style tab ----------------------------------------------------
    voiceSplit: jsonb('voice_split').$type<VoiceSplit>(),
    sentenceLengths: jsonb('sentence_lengths').$type<SentenceLengths>(),
    styleMetrics: jsonb('style_metrics').$type<StyleMetric[]>(),
    dialogueTags: jsonb('dialogue_tags').$type<DialogueTag[]>(),

    // ---- Narrative / pacing tab ---------------------------------------
    tension: jsonb('tension').$type<TensionPoint[]>(),
    pacing: jsonb('pacing').$type<PacingPoint[]>(),
    exposition: jsonb('exposition').$type<ExpositionPoint[]>(),

    // ---- Sensory tab --------------------------------------------------
    sensory: jsonb('sensory').$type<SensoryScore>(),
    sensoryAdvice: text('sensory_advice'), // plain-text coaching note

    // ---- Character / voice tab ----------------------------------------
    characters: jsonb('characters').$type<string[]>(),
    voiceMatrix: jsonb('voice_matrix').$type<CharacterPair[]>(),
    dialogueIssues: jsonb('dialogue_issues').$type<DialogueIssue[]>(),

    // ---- Summary stats ------------------------------------------------
    readabilityGrade: real('readability_grade'),
    avgSentenceWords: real('avg_sentence_words'),
    adverbPct: real('adverb_pct'),
    passivePct: real('passive_pct'),
  },
  (t) => [
    // 1:1 with sessions — enforce a single current analysis per session.
    uniqueIndex('analysis_results_session_id_idx').on(t.sessionId),
  ],
)

// ---------------------------------------------------------------------------
// Inferred types for use across the app
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type DbSession = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type AnalysisResult = typeof analysisResults.$inferSelect
export type NewAnalysisResult = typeof analysisResults.$inferInsert
