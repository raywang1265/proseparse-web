'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Type, Activity, Palette, Users } from 'lucide-react'
import { StyleTab } from './tabs/style-tab'
import { NarrativeTab } from './tabs/narrative-tab'
import { SensoryTab } from './tabs/sensory-tab'
import { CharacterTab } from './tabs/character-tab'

export function InsightsPanel({
  activeBlock,
  onHoverBlock,
  onSelectBlock,
}: {
  activeBlock: number | null
  onHoverBlock: (b: number | null) => void
  onSelectBlock: (b: number | null) => void
}) {
  return (
    <aside className="flex h-full w-[27rem] shrink-0 flex-col border-l border-border bg-card/40">
      <Tabs defaultValue="narrative" className="flex h-full min-h-0 flex-col gap-0">
        <div className="border-b border-border px-3 pb-2 pt-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-foreground">
              Insights Engine
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              ML · v2.4
            </span>
          </div>
          <TabsList className="grid h-auto w-full grid-cols-4 bg-muted/60 p-1">
            <TabTrigger value="style" icon={Type} label="Style" />
            <TabTrigger value="narrative" icon={Activity} label="Pacing" />
            <TabTrigger value="sensory" icon={Palette} label="Sensory" />
            <TabTrigger value="character" icon={Users} label="Voice" />
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-4">
            <TabsContent value="style" className="mt-0">
              <StyleTab />
            </TabsContent>
            <TabsContent value="narrative" className="mt-0">
              <NarrativeTab
                activeBlock={activeBlock}
                onHoverBlock={onHoverBlock}
                onSelectBlock={onSelectBlock}
              />
            </TabsContent>
            <TabsContent value="sensory" className="mt-0">
              <SensoryTab />
            </TabsContent>
            <TabsContent value="character" className="mt-0">
              <CharacterTab onSelectBlock={onSelectBlock} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </aside>
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
      className="flex-col gap-1 py-1.5 text-[11px] data-[state=active]:bg-background"
    >
      <Icon className="size-4" />
      {label}
    </TabsTrigger>
  )
}
