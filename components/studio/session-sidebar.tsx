'use client'

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  PanelLeftClose,
  Search,
  Loader2,
  Pencil,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Sparkline } from './sparkline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  createSessionAction,
  renameSessionAction,
  deleteSessionAction,
} from '@/app/studio/actions'
import type { SidebarSession, ViewState } from './types'

const STATUS_DOT: Record<ViewState, string | null> = {
  fresh: null,
  unanalyzed: 'bg-muted-foreground/40',
  stale: 'bg-chart-4',
  analyzing: 'bg-primary',
  error: 'bg-destructive',
}

export function SessionSidebar({
  sessions,
  activeId,
  collapsed,
  onCollapse,
}: {
  sessions: SidebarSession[]
  activeId: string | null
  collapsed: boolean
  onCollapse: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [pending, startTransition] = useTransition()

  if (collapsed) return null

  const filtered = query.trim()
    ? sessions.filter((s) =>
        s.title.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : sessions

  function handleNew() {
    startTransition(async () => {
      const { id } = await createSessionAction({})
      router.push(`/studio?s=${id}`)
    })
  }

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
        <Button
          onClick={handleNew}
          disabled={pending}
          className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          New Analysis
        </Button>
      </div>

      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
          {filtered.map((s) => (
            <SessionItem key={s.id} session={s} activeId={activeId} />
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">
              No sessions match “{query}”.
            </li>
          )}
        </ul>
      </ScrollArea>
    </aside>
  )
}

function SessionItem({
  session,
  activeId,
}: {
  session: SidebarSession
  activeId: string | null
}) {
  const router = useRouter()
  const isActive = session.id === activeId
  const dot = STATUS_DOT[session.viewState]

  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(session.title)
  const [optimisticTitle, setOptimisticTitle] = useState(session.title)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setOptimisticTitle(session.title)
    setValue(session.title)
  }, [session.title])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit() {
    const next = value.trim()
    setEditing(false)
    if (!next || next === optimisticTitle) {
      setValue(optimisticTitle)
      return
    }
    setOptimisticTitle(next)
    startTransition(async () => {
      try {
        await renameSessionAction(session.id, next)
      } catch {
        setOptimisticTitle(session.title)
        setValue(session.title)
      }
    })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setValue(optimisticTitle)
      setEditing(false)
    }
  }

  function handleDelete() {
    setDeleting(true)
    startTransition(async () => {
      try {
        await deleteSessionAction(session.id)
        // If we deleted the open session, fall back to the default session;
        // otherwise just refresh the list in place.
        if (isActive) router.push('/studio')
        else router.refresh()
      } catch {
        setDeleting(false)
        setConfirmOpen(false)
      }
    })
  }

  const meta = (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span>{session.dateLabel}</span>
      <span className="size-0.5 rounded-full bg-muted-foreground/50" />
      <span>{session.words.toLocaleString()} words</span>
    </div>
  )

  if (editing) {
    return (
      <li>
        <div
          className={cn(
            'flex w-full flex-col gap-1.5 rounded-2xl px-3 py-2.5',
            isActive ? 'bg-sidebar-accent' : 'bg-sidebar-accent/40',
          )}
        >
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            aria-label="Session title"
            className="w-full min-w-0 rounded-md bg-background/60 px-1.5 py-0.5 text-sm outline-none ring-1 ring-primary/50"
          />
          {meta}
        </div>
      </li>
    )
  }

  return (
    <li className="group relative">
      <Link
        href={`/studio?s=${session.id}`}
        className={cn(
          'flex w-full flex-col gap-1.5 rounded-2xl px-3 py-2.5 text-left transition-colors',
          isActive ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/60',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'flex min-w-0 items-center gap-1.5 truncate text-sm',
              isActive
                ? 'font-medium text-sidebar-accent-foreground'
                : 'text-foreground/80',
            )}
          >
            {dot && (
              <span
                className={cn('size-1.5 shrink-0 rounded-full', dot)}
                aria-hidden
              />
            )}
            <span className="truncate">{optimisticTitle}</span>
          </span>
          {session.spark && (
            <Sparkline
              data={session.spark}
              active={isActive}
              className="shrink-0 transition-opacity group-hover:opacity-0"
            />
          )}
        </div>
        {meta}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            title="Session options"
            aria-label="Session options"
            className={cn(
              'absolute right-2.5 top-2.5 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background/60 hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100',
            )}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setEditing(true)
            }}
          >
            <Pencil className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault()
              setConfirmOpen(true)
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              “{optimisticTitle}” and its analysis will be permanently deleted.
              This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
