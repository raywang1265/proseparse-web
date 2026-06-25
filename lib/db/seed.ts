import 'server-only'

import { db } from './index'
import { sessions, analysisResults } from './schema'
import { hashContent, countWords } from './hash'
import {
  SESSIONS,
  MANUSCRIPT,
  VOICE_SPLIT,
  SENTENCE_LENGTHS,
  STYLE_METRICS,
  DIALOGUE_TAGS,
  TENSION,
  PACING,
  EXPOSITION,
  SENSORY,
  CHARACTERS,
  VOICE_MATRIX,
  DIALOGUE_ISSUES,
} from '@/lib/analysis-data'

// Reconstruct the plain manuscript text from the annotated mock paragraphs so
// the seed session's editable source matches its analysis snapshot exactly.
function buildManuscriptText(): string {
  return MANUSCRIPT.map((p) => p.segments.map((s) => s.text).join('')).join('\n\n')
}

// Seed a brand-new user with the sample "Lighthouse" session as a real,
// DB-backed analysis (status `done`, hashes matching → "fresh"). This makes the
// full studio UI demonstrable on first login and exercises the staleness flow
// the moment the user edits. Until Phase 3 (Hugging Face) lands, the analysis
// payload reuses the curated mock values.
export async function seedSessionForUser(userId: string): Promise<string> {
  const text = buildManuscriptText()
  const contentHash = hashContent(text)
  const sessionId = crypto.randomUUID()

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    title: 'Ch. 12 — The Lighthouse',
    manuscriptText: text,
    contentHash,
    wordCount: countWords(text),
    status: 'done',
  })

  await db.insert(analysisResults).values({
    id: crypto.randomUUID(),
    sessionId,
    analyzedTextHash: contentHash,
    paragraphs: MANUSCRIPT,
    spark: SESSIONS[0]?.spark ?? null,
    voiceSplit: VOICE_SPLIT,
    sentenceLengths: SENTENCE_LENGTHS,
    styleMetrics: STYLE_METRICS,
    dialogueTags: DIALOGUE_TAGS,
    tension: TENSION,
    pacing: PACING,
    exposition: EXPOSITION,
    sensory: SENSORY,
    sensoryAdvice:
      'Taste and smell are underused. Consider grounding the lighthouse interior with an olfactory detail to deepen immersion.',
    characters: CHARACTERS,
    voiceMatrix: VOICE_MATRIX,
    dialogueIssues: DIALOGUE_ISSUES,
    readabilityGrade: 7,
    avgSentenceWords: 14.2,
    adverbPct: 3.1,
    passivePct: 22,
  })

  return sessionId
}
