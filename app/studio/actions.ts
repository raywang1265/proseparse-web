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
} from '@/lib/db/queries'

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
