'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PanelLeftOpen, Sparkles, Loader2 } from 'lucide-react'
import { SessionSidebar } from './session-sidebar'
import { ManuscriptEditor, type Lens } from './manuscript-editor'
import { InsightsPanel } from './insights-panel'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'
import { Button } from '@/components/ui/button'
import { saveSessionTextAction, analyzeSessionAction } from '@/app/studio/actions'
import type { SidebarSession, SidebarFolder, ActiveSession, ViewState } from './types'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function Workspace({
  sessions,
  folders,
  activeId,
  active,
}: {
  sessions: SidebarSession[]
  folders: SidebarFolder[]
  activeId: string | null
  active: ActiveSession | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [collapsed, setCollapsed] = useState(false)
  const [lens, setLens] = useState<Lens>('none')
  const [activeBlock, setActiveBlock] = useState<number | null>(null)
  // Separate from activeBlock — only updated when a chart drives the selection.
  // The editor watches this to scroll; paragraph hovers never touch it so they
  // don't cause the editor to scroll to a paragraph the user is already on.
  const [chartActiveBlock, setChartActiveBlock] = useState<number | null>(null)

  function handleChartHover(b: number | null) {
    setActiveBlock(b)
    setChartActiveBlock(b)
  }
  const [mode, setMode] = useState<'read' | 'edit'>(
    active?.viewState === 'fresh' ? 'read' : 'edit',
  )

  const [text, setText] = useState(active?.text ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // An edit that diverges from the analyzed snapshot makes the analysis stale
  // immediately in the UI — without waiting for a server round-trip.
  const locallyEdited = active != null && text !== active.text
  const effectiveViewState: ViewState =
    locallyEdited && active?.analysis ? 'stale' : (active?.viewState ?? 'unanalyzed')

  const scheduleSave = useCallback(
    (next: string) => {
      if (!active) return
      if (timer.current) clearTimeout(timer.current)
      setSaveState('saving')
      timer.current = setTimeout(async () => {
        try {
          await saveSessionTextAction(active.id, next)
          setSaveState('saved')
        } catch {
          setSaveState('error')
        }
      }, 800)
    },
    [active],
  )

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function handleTextChange(next: string) {
    setText(next)
    scheduleSave(next)
  }

  const canReanalyze =
    !isPending &&
    active != null &&
    (effectiveViewState === 'stale' ||
      effectiveViewState === 'unanalyzed' ||
      effectiveViewState === 'error')

  function handleReanalyze() {
    if (!active) return
    startTransition(async () => {
      await analyzeSessionAction(active.id)
      router.refresh()
    })
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border/40 px-3">
        <div className="flex items-center gap-2">
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={() => setCollapsed(false)}
              aria-label="Open sidebar"
            >
              <PanelLeftOpen className="size-4" />
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            <span className="text-foreground/80">Saltwater</span>
            <span className="mx-1.5 text-muted-foreground/50">/</span>
            {active?.title ?? 'No session'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            disabled={!canReanalyze}
            onClick={handleReanalyze}
            title={
              isPending
                ? 'Analyzing…'
                : canReanalyze
                  ? 'Re-analyze this draft'
                  : 'Analysis is up to date'
            }
            className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {isPending ? 'Analyzing…' : 'Re-analyze'}
          </Button>
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <SessionSidebar
          sessions={sessions}
          folders={folders}
          activeId={activeId}
          collapsed={collapsed}
          onCollapse={() => setCollapsed(true)}
        />
        {active ? (
          <>
            <ManuscriptEditor
              sessionId={active.id}
              title={active.title}
              wordCount={active.wordCount}
              viewState={effectiveViewState}
              mode={mode}
              onModeChange={setMode}
              text={text}
              onTextChange={handleTextChange}
              saveState={saveState}
              paragraphs={active.analysis?.paragraphs ?? null}
              lens={lens}
              onLensChange={setLens}
              activeBlock={activeBlock}
              scrollToBlock={chartActiveBlock}
              onHoverBlock={setActiveBlock}
            />
            <InsightsPanel
              viewState={effectiveViewState}
              analysis={active.analysis}
              activeBlock={activeBlock}
              onHoverBlock={handleChartHover}
              onSelectBlock={handleChartHover}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select or create a session to begin.
          </div>
        )}
      </div>
    </div>
  )
}
