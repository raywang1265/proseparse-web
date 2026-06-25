import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { getCurrentUser } from '@/lib/auth/server'
import { ensureUser, listSessions, getSession } from '@/lib/db/queries'
import { seedSessionForUser } from '@/lib/db/seed'
import { Workspace } from '@/components/studio/workspace'
import type {
  SidebarSession,
  ActiveSession,
  StudioAnalysis,
} from '@/components/studio/types'
import type { AnalysisResult } from '@/lib/db/schema'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/studio')

  await ensureUser(user)

  let list = await listSessions(user.uid)
  if (list.length === 0) {
    await seedSessionForUser(user.uid)
    list = await listSessions(user.uid)
  }

  const { s } = await searchParams
  const activeId = s && list.some((x) => x.id === s) ? s : list[0]?.id
  const detail = activeId ? await getSession(user.uid, activeId) : null

  const sidebar: SidebarSession[] = list.map((x) => ({
    id: x.id,
    title: x.title,
    dateLabel: formatDistanceToNow(x.updatedAt, { addSuffix: true }),
    words: x.wordCount,
    spark: x.spark,
    viewState: x.viewState,
  }))

  const active: ActiveSession | null = detail
    ? {
        id: detail.session.id,
        title: detail.session.title,
        text: detail.session.manuscriptText,
        wordCount: detail.session.wordCount,
        viewState: detail.viewState,
        analysis: detail.analysis ? toStudioAnalysis(detail.analysis) : null,
      }
    : null

  return (
    <Workspace
      key={active?.id ?? 'empty'}
      sessions={sidebar}
      activeId={activeId ?? null}
      active={active}
    />
  )
}

function toStudioAnalysis(a: AnalysisResult): StudioAnalysis {
  return {
    paragraphs: a.paragraphs ?? null,
    spark: a.spark ?? null,
    voiceSplit: a.voiceSplit ?? null,
    sentenceLengths: a.sentenceLengths ?? null,
    styleMetrics: a.styleMetrics ?? null,
    dialogueTags: a.dialogueTags ?? null,
    tension: a.tension ?? null,
    pacing: a.pacing ?? null,
    exposition: a.exposition ?? null,
    sensory: a.sensory ?? null,
    sensoryAdvice: a.sensoryAdvice ?? null,
    characters: a.characters ?? null,
    voiceMatrix: a.voiceMatrix ?? null,
    dialogueIssues: a.dialogueIssues ?? null,
  }
}
