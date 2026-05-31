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
    <aside className="flex h-full w-[27rem] shrink-0 flex-col border-l border-border/40 bg-card/30">
      <Tabs defaultValue="narrative" className="flex h-full min-h-0 flex-col gap-0">
        <div className="px-4 pb-3 pt-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-serif text-base font-semibold tracking-tight text-foreground">
              Insights
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              live
            </span>
          </div>
          <TabsList className="grid h-auto w-full grid-cols-4 rounded-2xl bg-muted/50 p-1">
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
      className="flex-col gap-1 rounded-xl py-1.5 text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm"
    >
      <Icon className="size-4" />
      {label}
    </TabsTrigger>
  )
}
