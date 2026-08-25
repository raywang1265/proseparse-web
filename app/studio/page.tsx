import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { getCurrentUser } from '@/lib/auth/server'
import { ensureUser, listSessions, listFolders, getSession } from '@/lib/db/queries'
import { Workspace } from '@/components/studio/workspace'
import type {
  SidebarSession,
  SidebarFolder,
  ActiveSession,
  StudioAnalysis,
} from '@/components/studio/types'
import type { AnalysisResult } from '@/lib/db/schema'

// Cold /exposition batches can approach Cloud Run's 120s timeout; give the
// Re-analyze server action enough room on hosted runtimes.
export const maxDuration = 300

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/studio')

  await ensureUser(user)

  const list = await listSessions(user.uid)
  const folderList = await listFolders(user.uid)

  const { s } = await searchParams
  const activeId = s && list.some((x) => x.id === s) ? s : list[0]?.id
  const detail = activeId ? await getSession(user.uid, activeId) : null

  const sidebar: SidebarSession[] = list.map((x) => ({
    id: x.id,
    title: x.title,
    folderId: x.folderId,
    dateLabel: formatDistanceToNow(x.updatedAt, { addSuffix: true }),
    words: x.wordCount,
    spark: x.spark,
    viewState: x.viewState,
  }))

  const folders: SidebarFolder[] = folderList.map((f) => ({
    id: f.id,
    name: f.name,
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
      folders={folders}
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
    voiceTrend: a.voiceTrend ?? null,
    sentenceLengths: a.sentenceLengths ?? null,
    styleMetrics: a.styleMetrics ?? null,
    dialogueTags: a.dialogueTags ?? null,
    tension: a.tension ?? null,
    pacing: a.pacing ?? null,
    exposition: a.exposition ?? null,
    sensory: a.sensory ?? null,
    sensoryAdvice: a.sensoryAdvice ?? null,
    sensorySpans: a.sensorySpans ?? null,
    characters: a.characters ?? null,
    voiceMatrix: a.voiceMatrix ?? null,
    voiceProfiles: a.voiceProfiles ?? null,
    dialogueIssues: a.dialogueIssues ?? null,
    speakerSpans: a.speakerSpans ?? null,
  }
}
