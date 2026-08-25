'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PanelLeftOpen, Sparkles, Loader2, Plus } from 'lucide-react'
import { SessionSidebar } from './session-sidebar'
import { ManuscriptEditor, type Lens, type SpeakerLens } from './manuscript-editor'
import { InsightsPanel } from './insights-panel'
import { ThemeToggle } from './theme-toggle'
import { UserMenu } from './user-menu'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  saveSessionTextAction,
  analyzeSessionAction,
  createSessionAction,
} from '@/app/studio/actions'
import type { SidebarSession, SidebarFolder, ActiveSession, ViewState } from './types'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Estimated (not real) analysis progress. The server action reports nothing
 * until it finishes, so this eases toward ~88% over a couple of minutes and
 * snaps to 100% when the run completes.
 */
function useEstimatedProgress(active: boolean) {
  const [visible, setVisible] = useState(false)
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (active) {
      setVisible(true)
      setValue(0)
      const start = Date.now()
      const id = window.setInterval(() => {
        const t = (Date.now() - start) / 1000
        // (1 - e^(-t/36)) * 88 → ~50% at 25s, ~75% at 50s, still under 88% at 2min
        setValue((1 - Math.exp(-t / 36)) * 88)
      }, 80)
      return () => window.clearInterval(id)
    }

    setValue((prev) => (prev > 0 ? 100 : 0))
    const hide = window.setTimeout(() => {
      setVisible(false)
      setValue(0)
    }, 400)
    return () => window.clearTimeout(hide)
  }, [active])

  return { visible, value }
}

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
  const [isCreating, startCreate] = useTransition()
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [lens, setLens] = useState<Lens>('none')
  const [speakerLens, setSpeakerLens] = useState<SpeakerLens>('off')
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

  const canReanalyze = !isPending && active != null
  const progress = useEstimatedProgress(isPending)

  function handleReanalyze() {
    if (!active) return
    setAnalyzeError(null)
    startTransition(async () => {
      try {
        await analyzeSessionAction(active.id)
        router.refresh()
      } catch (err) {
        setAnalyzeError(
          err instanceof Error ? err.message : 'Analysis failed. Please try again.',
        )
      }
    })
  }

  function handleNew() {
    startCreate(async () => {
      const { id } = await createSessionAction({})
      router.push(`/studio?s=${id}`)
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
        <div className="flex items-center gap-2">
          {analyzeError && (
            <span
              className="max-w-56 truncate text-xs text-destructive"
              title={analyzeError}
            >
              {analyzeError}
            </span>
          )}
          {isPending && (
            <p className="hidden max-w-48 text-right text-[11px] leading-snug text-muted-foreground sm:block">
            </p>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  size="sm"
                  disabled={!canReanalyze}
                  onClick={handleReanalyze}
                  className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  {isPending ? 'Analyzing…' : 'Re-analyze'}
                </Button>
              </span>
            </TooltipTrigger>
            {!isPending && (
              <TooltipContent side="bottom">
                {active ? 'Re-analyze this draft' : 'Open a session to analyze'}
              </TooltipContent>
            )}
          </Tooltip>
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      {progress.visible && (
        <div
          className="h-1 shrink-0 bg-primary/15"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress.value)}
          aria-label="Analysis progress (estimated)"
        >
          <div
            className="h-full bg-primary transition-[width] duration-200 ease-out"
            style={{ width: `${progress.value}%` }}
          />
        </div>
      )}

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
              speakerLens={speakerLens}
              onSpeakerLensChange={setSpeakerLens}
              speakerSpans={active.analysis?.speakerSpans ?? null}
              sensorySpans={active.analysis?.sensorySpans ?? null}
              activeBlock={activeBlock}
              scrollToBlock={chartActiveBlock}
              onHoverBlock={setActiveBlock}
            />
            <InsightsPanel
              viewState={isPending ? 'analyzing' : effectiveViewState}
              analysis={active.analysis}
              activeBlock={activeBlock}
              onHoverBlock={handleChartHover}
              onSelectBlock={handleChartHover}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="text-sm font-medium text-foreground">No session open</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Start a new analysis to paste a draft and map its voice, exposition,
              and sensory texture.
            </p>
            <Button
              onClick={handleNew}
              disabled={isCreating}
              className="mt-1 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isCreating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              New Analysis
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
