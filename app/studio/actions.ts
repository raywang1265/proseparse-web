'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/server'
import {
  ensureUser,
  createSession,
  saveSessionText,
  renameSession,
  deleteSession,
  createFolder,
  renameFolder,
  deleteFolder,
  moveSession,
  upsertAnalysis,
  getSession,
} from '@/lib/db/queries'
import { analyzeManuscript } from '@/lib/analysis/analyze'
import { analyzeManuscriptRemote, hasRemoteBackend } from '@/lib/analysis/batch'
import { analyzeVoicesRemote } from '@/lib/analysis/voice'
import type { VoiceAnalysisPayload } from '@/lib/analysis/voice'
import { analyzeSensoryRemote } from '@/lib/analysis/sensory'
import type { SensoryAnalysisPayload } from '@/lib/analysis/sensory'
import { analyzeExpositionRemote } from '@/lib/analysis/exposition'
import type { ExpositionAnalysisPayload } from '@/lib/analysis/exposition'

async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function createSessionAction(input: {
  title?: string
  text?: string
}) {
  const user = await requireUser()
  await ensureUser(user)
  const session = await createSession(user.uid, input)
  revalidatePath('/studio')
  return { id: session.id }
}

// Autosave. Returns the new save metadata so the client can show "saved" state
// and update staleness without a full refetch.
export async function saveSessionTextAction(sessionId: string, text: string) {
  const user = await requireUser()
  const result = await saveSessionText(user.uid, sessionId, text)
  if (!result) throw new Error('Session not found')
  revalidatePath('/studio')
  return result
}

export async function renameSessionAction(sessionId: string, title: string) {
  const user = await requireUser()
  const ok = await renameSession(user.uid, sessionId, title)
  if (!ok) throw new Error('Session not found')
  revalidatePath('/studio')
}

export async function deleteSessionAction(sessionId: string) {
  const user = await requireUser()
  const ok = await deleteSession(user.uid, sessionId)
  if (!ok) throw new Error('Session not found')
  revalidatePath('/studio')
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export async function createFolderAction(name: string) {
  const user = await requireUser()
  await ensureUser(user)
  const folder = await createFolder(user.uid, name)
  revalidatePath('/studio')
  return { id: folder.id }
}

export async function renameFolderAction(folderId: string, name: string) {
  const user = await requireUser()
  const ok = await renameFolder(user.uid, folderId, name)
  if (!ok) throw new Error('Folder not found')
  revalidatePath('/studio')
}

export async function deleteFolderAction(folderId: string) {
  const user = await requireUser()
  const ok = await deleteFolder(user.uid, folderId)
  if (!ok) throw new Error('Folder not found')
  revalidatePath('/studio')
}

export async function moveSessionAction(
  sessionId: string,
  folderId: string | null,
) {
  const user = await requireUser()
  const ok = await moveSession(user.uid, sessionId, folderId)
  if (!ok) throw new Error('Session not found or folder not accessible')
  revalidatePath('/studio')
}

// Runs the heuristic analysis pass (dialogue + sentence length) and persists
// the result. The Re-analyze button calls this, then refreshes the page so
// the server re-renders with a fresh viewState.
export async function analyzeSessionAction(sessionId: string) {
  const user = await requireUser()
  const detail = await getSession(user.uid, sessionId)
  if (!detail) throw new Error('Session not found')

  const text = detail.session.manuscriptText
  // Use the batched FastAPI backend when configured (scales to large
  // manuscripts by fanning paragraphs out into batches); otherwise fall back
  // to the in-process heuristic analyzer.
  //
  // /analyze and /sensory run in parallel. /voice and /exposition run after
  // so they do not starve the style pass on Cloud Run (concurrency=1 per instance).
  const remote = hasRemoteBackend()

  const [payload, sensory] = await Promise.all([
    remote
      ? analyzeManuscriptRemote(text, { sessionId })
      : Promise.resolve(analyzeManuscript(text)),
    remote
      ? analyzeSensoryRemote(text, { sessionId }).catch((err) => {
          console.error('sensory analysis failed', err)
          return null as SensoryAnalysisPayload | null
        })
      : Promise.resolve(null as SensoryAnalysisPayload | null),
  ])

  // Voice (MiniLM) and exposition (DeBERTa) are heavier. Soft-fail so a cold
  // start / timeout does not block the main style analysis from persisting.
  let voice: VoiceAnalysisPayload | null = null
  let exposition: ExpositionAnalysisPayload | null = null
  if (remote) {
    const [voiceResult, expositionResult] = await Promise.all([
      analyzeVoicesRemote(text, { sessionId }).catch((err) => {
        console.error('voice analysis failed', err)
        return null as VoiceAnalysisPayload | null
      }),
      analyzeExpositionRemote(text, { sessionId }).catch((err) => {
        console.error('exposition analysis failed', err)
        return null as ExpositionAnalysisPayload | null
      }),
    ])
    voice = voiceResult
    exposition = expositionResult
  }

  const ok = await upsertAnalysis(user.uid, sessionId, {
    paragraphs: payload.paragraphs,
    spark: null,
    voiceSplit: payload.voiceSplit,
    voiceTrend: payload.voiceTrend,
    sentenceLengths: payload.sentenceLengths,
    styleMetrics: payload.styleMetrics,
    dialogueTags: payload.dialogueTags,
    tension: null,
    pacing: null,
    exposition: exposition?.points ?? null,
    sensory: sensory?.scores ?? null,
    sensoryAdvice: sensory?.advice ?? null,
    sensorySpans: sensory?.spans ?? null,
    characters: voice?.characters ?? null,
    voiceMatrix: voice?.voiceMatrix ?? null,
    voiceProfiles: voice?.voiceProfiles ?? null,
    dialogueIssues: voice?.dialogueIssues ?? null,
    speakerSpans: voice?.speakerSpans ?? null,
    readabilityGrade: null,
    avgSentenceWords: payload.avgSentenceWords,
    adverbPct: null,
    passivePct: payload.passivePct,
  })

  if (!ok) throw new Error('Failed to save analysis')
  revalidatePath('/studio')
}
