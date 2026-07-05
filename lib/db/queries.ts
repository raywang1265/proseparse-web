import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import { db } from './index'
import { users, sessions, folders, analysisResults } from './schema'
import type { DbSession, DbFolder, AnalysisResult, NewAnalysisResult } from './schema'
import { hashContent, countWords } from './hash'
import { getViewState, type AnalysisViewState } from './staleness'
import type { ServerUser } from '@/lib/auth/server'

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

// Mirror the Firebase identity into our users table. Called on authenticated
// requests so app data always has a valid user row to reference.
export async function ensureUser(user: ServerUser): Promise<void> {
  await db
    .insert(users)
    .values({
      id: user.uid,
      email: user.email ?? '',
      name: user.name,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: user.email ?? '',
        name: user.name,
        updatedAt: new Date(),
      },
    })
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export type FolderListItem = Pick<DbFolder, 'id' | 'name'>

export async function listFolders(userId: string): Promise<FolderListItem[]> {
  return db
    .select({ id: folders.id, name: folders.name })
    .from(folders)
    .where(eq(folders.userId, userId))
    .orderBy(folders.createdAt)
}

export async function createFolder(
  userId: string,
  name: string,
): Promise<DbFolder> {
  const [folder] = await db
    .insert(folders)
    .values({ id: crypto.randomUUID(), userId, name: name.trim() || 'New folder' })
    .returning()
  return folder
}

export async function renameFolder(
  userId: string,
  folderId: string,
  name: string,
): Promise<boolean> {
  const result = await db
    .update(folders)
    .set({ name: name.trim() || 'New folder', updatedAt: new Date() })
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .returning({ id: folders.id })
  return result.length > 0
}

// Deletes the folder and moves its sessions back to root (folderId → null).
// The SET NULL behaviour is enforced by the FK constraint, so a plain delete
// is sufficient — Postgres will null the sessions.folder_id automatically.
export async function deleteFolder(
  userId: string,
  folderId: string,
): Promise<boolean> {
  const result = await db
    .delete(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .returning({ id: folders.id })
  return result.length > 0
}

export async function moveSession(
  userId: string,
  sessionId: string,
  folderId: string | null,
): Promise<boolean> {
  // Verify the target folder belongs to this user when non-null.
  if (folderId !== null) {
    const [folder] = await db
      .select({ id: folders.id })
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .limit(1)
    if (!folder) return false
  }

  const result = await db
    .update(sessions)
    .set({ folderId })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .returning({ id: sessions.id })
  return result.length > 0
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export type SessionListItem = {
  id: string
  title: string
  folderId: string | null
  wordCount: number
  status: DbSession['status']
  updatedAt: Date
  spark: number[] | null
  viewState: AnalysisViewState
}

// Sessions for the sidebar, newest-edited first. Joins the analysis row to
// surface the spark series and derive each session's view state.
export async function listSessions(userId: string): Promise<SessionListItem[]> {
  const rows = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      folderId: sessions.folderId,
      wordCount: sessions.wordCount,
      status: sessions.status,
      updatedAt: sessions.updatedAt,
      contentHash: sessions.contentHash,
      analyzedTextHash: analysisResults.analyzedTextHash,
      spark: analysisResults.spark,
    })
    .from(sessions)
    .leftJoin(analysisResults, eq(analysisResults.sessionId, sessions.id))
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.updatedAt))

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    folderId: r.folderId ?? null,
    wordCount: r.wordCount,
    status: r.status,
    updatedAt: r.updatedAt,
    spark: r.spark ?? null,
    viewState: getViewState(
      { contentHash: r.contentHash, status: r.status },
      r.analyzedTextHash ? { analyzedTextHash: r.analyzedTextHash } : null,
    ),
  }))
}

export type SessionDetail = {
  session: DbSession
  analysis: AnalysisResult | null
  viewState: AnalysisViewState
}

// A single session plus its (possibly stale, possibly absent) analysis and the
// derived view state. Scoped to the owner so users can't read others' data.
export async function getSession(
  userId: string,
  sessionId: string,
): Promise<SessionDetail | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .limit(1)

  if (!session) return null

  const [analysis] = await db
    .select()
    .from(analysisResults)
    .where(eq(analysisResults.sessionId, sessionId))
    .limit(1)

  return {
    session,
    analysis: analysis ?? null,
    viewState: getViewState(session, analysis ?? null),
  }
}

export async function createSession(
  userId: string,
  input: { title?: string; text?: string } = {},
): Promise<DbSession> {
  const text = input.text ?? ''
  const [session] = await db
    .insert(sessions)
    .values({
      id: crypto.randomUUID(),
      userId,
      title: input.title?.trim() || 'Untitled draft',
      manuscriptText: text,
      contentHash: hashContent(text),
      wordCount: countWords(text),
      status: 'pending',
    })
    .returning()

  return session
}

// Autosave manuscript text. Recomputes the content hash + word count and bumps
// updatedAt. The saved analysis is intentionally left untouched — staleness is
// derived from the hash mismatch, so a reverted edit re-validates it for free.
export async function saveSessionText(
  userId: string,
  sessionId: string,
  text: string,
): Promise<{ updatedAt: Date; contentHash: string; wordCount: number } | null> {
  const now = new Date()
  const contentHash = hashContent(text)
  const wordCount = countWords(text)

  const [updated] = await db
    .update(sessions)
    .set({ manuscriptText: text, contentHash, wordCount, updatedAt: now })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .returning({ updatedAt: sessions.updatedAt })

  if (!updated) return null
  return { updatedAt: updated.updatedAt, contentHash, wordCount }
}

export async function renameSession(
  userId: string,
  sessionId: string,
  title: string,
): Promise<boolean> {
  const result = await db
    .update(sessions)
    .set({ title: title.trim() || 'Untitled draft', updatedAt: new Date() })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .returning({ id: sessions.id })

  return result.length > 0
}

export async function deleteSession(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const result = await db
    .delete(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .returning({ id: sessions.id })

  return result.length > 0
}

// ---------------------------------------------------------------------------
// Analysis upsert
// ---------------------------------------------------------------------------

// Persists a completed analysis for a session. Ownership is verified before
// writing. The analyzedTextHash is always taken from the session's current
// contentHash so the result starts "fresh". Sets session.status = 'done'.
export async function upsertAnalysis(
  userId: string,
  sessionId: string,
  fields: Omit<NewAnalysisResult, 'id' | 'sessionId' | 'analyzedTextHash' | 'createdAt'>,
): Promise<boolean> {
  // Verify ownership and grab the current content hash in one query.
  const [session] = await db
    .select({ contentHash: sessions.contentHash })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .limit(1)

  if (!session) return false

  const values: NewAnalysisResult = {
    id: crypto.randomUUID(),
    sessionId,
    analyzedTextHash: session.contentHash,
    ...fields,
  }

  await db
    .insert(analysisResults)
    .values(values)
    .onConflictDoUpdate({
      target: analysisResults.sessionId,
      set: {
        analyzedTextHash: values.analyzedTextHash,
        paragraphs: values.paragraphs,
        spark: values.spark,
        voiceSplit: values.voiceSplit,
        voiceTrend: values.voiceTrend,
        sentenceLengths: values.sentenceLengths,
        styleMetrics: values.styleMetrics,
        dialogueTags: values.dialogueTags,
        tension: values.tension,
        pacing: values.pacing,
        exposition: values.exposition,
        sensory: values.sensory,
        sensoryAdvice: values.sensoryAdvice,
        characters: values.characters,
        voiceMatrix: values.voiceMatrix,
        dialogueIssues: values.dialogueIssues,
        readabilityGrade: values.readabilityGrade,
        avgSentenceWords: values.avgSentenceWords,
        adverbPct: values.adverbPct,
        passivePct: values.passivePct,
      },
    })

  await db
    .update(sessions)
    .set({ status: 'done' })
    .where(eq(sessions.id, sessionId))

  return true
}
