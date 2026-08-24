'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Type,
  BookOpen,
  Palette,
  Users,
  Sparkles,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { StyleTab } from './tabs/style-tab'
import { ExpositionTab } from './tabs/exposition-tab'
import { SensoryTab } from './tabs/sensory-tab'
import { CharacterTab } from './tabs/character-tab'
import { cn } from '@/lib/utils'
import type { StudioAnalysis, ViewState } from './types'

const noop = () => {}

export function InsightsPanel({
  viewState,
  analysis,
  activeBlock,
  onHoverBlock,
  onSelectBlock,
}: {
  viewState: ViewState
  analysis: StudioAnalysis | null
  activeBlock: number | null
  onHoverBlock: (b: number | null) => void
  onSelectBlock: (b: number | null) => void
}) {
  const stale = viewState === 'stale'
  const analyzing = viewState === 'analyzing'
  const hasAnalysis = !!analysis

  // When stale, the analysis no longer maps to the live text — disable the
  // chart→paragraph tethering so hovering/clicking can't drive the editor.
  const hover = stale ? noop : onHoverBlock
  const select = stale ? noop : onSelectBlock

  return (
    <aside className="flex h-full w-[27rem] shrink-0 flex-col border-l border-border/40 bg-card/30">
      <Tabs defaultValue="exposition" className="flex h-full min-h-0 flex-col gap-0">
        <div className="px-4 pb-3 pt-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-serif text-base font-semibold tracking-tight text-foreground">
              Insights
            </h2>
            <StatusBadge viewState={viewState} />
          </div>
          <TabsList className="grid h-auto w-full grid-cols-4 rounded-2xl bg-muted/50 p-1">
            <TabTrigger value="style" icon={Type} label="Style" />
            <TabTrigger value="exposition" icon={BookOpen} label="Exposition" />
            <TabTrigger value="sensory" icon={Palette} label="Sensory" />
            <TabTrigger value="character" icon={Users} label="Voice" />
          </TabsList>
        </div>

        {analyzing || !hasAnalysis ? (
          <EmptyState viewState={analyzing ? 'analyzing' : viewState} />
        ) : (
          <>
            {stale && <StaleBanner />}
            <ScrollArea className="min-h-0 flex-1">
              <div className={cn('p-4', stale && 'pointer-events-none opacity-60')}>
                <TabsContent value="style" className="mt-0">
                  <StyleTab analysis={analysis} />
                </TabsContent>
                <TabsContent value="exposition" className="mt-0">
                  <ExpositionTab
                    analysis={analysis}
                    activeBlock={stale ? null : activeBlock}
                    onHoverBlock={hover}
                    onSelectBlock={select}
                  />
                </TabsContent>
                <TabsContent value="sensory" className="mt-0">
                  <SensoryTab analysis={analysis} />
                </TabsContent>
                <TabsContent value="character" className="mt-0">
                  <CharacterTab analysis={analysis} onSelectBlock={select} />
                </TabsContent>
              </div>
            </ScrollArea>
          </>
        )}
      </Tabs>
    </aside>
  )
}

function StatusBadge({ viewState }: { viewState: ViewState }) {
  if (viewState === 'fresh')
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary" />
        live
      </span>
    )
  if (viewState === 'stale')
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-chart-4">
        <span className="size-1.5 rounded-full bg-chart-4" />
        out of date
      </span>
    )
  return null
}

function StaleBanner() {
  return (
    <div className="mx-4 mb-1 flex items-center gap-2 rounded-lg border border-chart-4/30 bg-chart-4/10 px-3 py-2 text-xs text-foreground/80">
      <AlertTriangle className="size-3.5 shrink-0 text-chart-4" />
      <span>
        Based on a previous version of this text. Re-analyze to refresh these
        insights.
      </span>
    </div>
  )
}

function EmptyState({ viewState }: { viewState: ViewState }) {
  const content =
    viewState === 'analyzing'
      ? {
          icon: <Loader2 className="size-5 animate-spin text-muted-foreground" />,
          title: 'Analyzing your draft…',
            body: 'This can take up to a couple of minutes, especially on the first run.',
        }
      : viewState === 'error'
        ? {
            icon: <AlertTriangle className="size-5 text-destructive" />,
            title: 'Analysis failed',
            body: 'Something went wrong last time. Try re-analyzing.',
          }
        : {
            icon: <Sparkles className="size-5 text-muted-foreground" />,
            title: 'No insights yet',
            body: 'Run an analysis to map this draft’s exposition, voice, and sensory texture.',
          }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
      {content.icon}
      <p className="text-sm font-medium text-foreground">{content.title}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {content.body}
      </p>
    </div>
  )
}

function TabTrigger({
  value,
  icon: Icon,
  label,
}: {
  value: string
  icon: typeof Type
  label: string
}) {
  return (
    <TabsTrigger
      value={value}
      className="flex-col gap-1 rounded-xl py-1.5 text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm"
    >
      <Icon className="size-4" />
      {label}
    </TabsTrigger>
  )
}
