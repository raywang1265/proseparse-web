'use client'

import Link from 'next/link'
import { Plus, PanelLeftClose, Search } from 'lucide-react'
import { SESSIONS } from '@/lib/analysis-data'
import { Logo } from '@/components/brand/logo'
import { Sparkline } from './sparkline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function SessionSidebar({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean
  onCollapse: () => void
}) {
  if (collapsed) return null

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border/50 bg-sidebar">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/">
          <Logo />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={onCollapse}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      <div className="px-3">
        <Button className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="size-4" />
          New Analysis
        </Button>
      </div>

      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sessions"
            className="h-9 bg-sidebar-accent/50 pl-8 text-sm"
          />
        </div>
      </div>

      <p className="px-4 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Recent sessions
      </p>

      <ScrollArea className="flex-1 px-2">
        <ul className="flex flex-col gap-0.5 pb-4">
          {SESSIONS.map((s) => (
            <li key={s.id}>
              <button
                className={cn(
                  'group flex w-full flex-col gap-1.5 rounded-2xl px-3 py-2.5 text-left transition-colors',
                  s.active
                    ? 'bg-sidebar-accent'
                    : 'hover:bg-sidebar-accent/60',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-sm',
                      s.active
                        ? 'font-medium text-sidebar-accent-foreground'
                        : 'text-foreground/80',
                    )}
                  >
                    {s.title}
                  </span>
                  <Sparkline
                    data={s.spark}
                    active={s.active}
                    className="shrink-0"
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{s.date}</span>
                  <span className="size-0.5 rounded-full bg-muted-foreground/50" />
                  <span>{s.words.toLocaleString()} words</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </aside>
  )
}
