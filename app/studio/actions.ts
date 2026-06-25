'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/server'
import {
  ensureUser,
  createSession,
  saveSessionText,
  renameSession,
  deleteSession,
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
