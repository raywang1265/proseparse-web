'use client'

import { useState } from 'react'
import { PanelLeftOpen, Sparkles } from 'lucide-react'
import { SessionSidebar } from './session-sidebar'
import { ManuscriptEditor, type Lens } from './manuscript-editor'
import { InsightsPanel } from './insights-panel'
import { ThemeToggle } from './theme-toggle'
import { Button } from '@/components/ui/button'

export function Workspace() {
  const [collapsed, setCollapsed] = useState(false)
  const [lens, setLens] = useState<Lens>('none')
  // shared "active paragraph" tethering the editor and the charts
  const [activeBlock, setActiveBlock] = useState<number | null>(null)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* Global top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
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
            Ch. 12 — The Lighthouse
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="size-3.5" />
            Re-analyze
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* 3-pane body */}
      <div className="flex min-h-0 flex-1">
        <SessionSidebar
          collapsed={collapsed}
          onCollapse={() => setCollapsed(true)}
        />
        <ManuscriptEditor
          lens={lens}
          onLensChange={setLens}
          activeBlock={activeBlock}
          onHoverBlock={setActiveBlock}
        />
        <InsightsPanel
          activeBlock={activeBlock}
          onHoverBlock={setActiveBlock}
          onSelectBlock={setActiveBlock}
        />
      </div>
    </div>
  )
}
