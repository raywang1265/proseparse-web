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
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  PanelLeftClose,
  Search,
  Loader2,
  Pencil,
  MoreHorizontal,
  Trash2,
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  FolderX,
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
  createFolderAction,
  renameFolderAction,
  deleteFolderAction,
  moveSessionAction,
} from '@/app/studio/actions'
import type { SidebarSession, SidebarFolder, ViewState } from './types'

const STATUS_DOT: Record<ViewState, string | null> = {
  fresh: null,
  unanalyzed: 'bg-muted-foreground/40',
  stale: 'bg-chart-4',
  analyzing: 'bg-primary',
  error: 'bg-destructive',
}

// ---------------------------------------------------------------------------
// Root sidebar
// ---------------------------------------------------------------------------

export function SessionSidebar({
  sessions: initialSessions,
  folders: initialFolders,
  activeId,
  collapsed,
  onCollapse,
}: {
  sessions: SidebarSession[]
  folders: SidebarFolder[]
  activeId: string | null
  collapsed: boolean
  onCollapse: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [pending, startTransition] = useTransition()

  // Optimistic state for drag-and-drop moves
  const [sessions, setSessions] = useState(initialSessions)
  const [folders, setFolders] = useState(initialFolders)

  // Folder whose name should immediately enter edit mode after creation
  const [pendingFolderId, setPendingFolderId] = useState<string | null>(null)

  // ID of the session currently being dragged
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  // Sync when server data refreshes (after revalidatePath)
  useEffect(() => { setSessions(initialSessions) }, [initialSessions])
  useEffect(() => { setFolders(initialFolders) }, [initialFolders])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  if (collapsed) return null

  const isSearching = query.trim().length > 0

  const filtered = isSearching
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

  function handleNewFolder() {
    startTransition(async () => {
      const { id } = await createFolderAction('New folder')
      setFolders((prev) => [...prev, { id, name: 'New folder' }])
      setPendingFolderId(id)
    })
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const sessionId = active.id as string
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) return

    // over.id is either a folderId string or the sentinel 'root'
    const targetFolderId = over.id === 'root' ? null : (over.id as string)

    if (session.folderId === targetFolderId) return

    // Optimistic update
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, folderId: targetFolderId } : s,
      ),
    )

    startTransition(async () => {
      try {
        await moveSessionAction(sessionId, targetFolderId)
      } catch {
        setSessions(initialSessions)
      }
    })
  }

  const draggedSession = activeDragId
    ? sessions.find((s) => s.id === activeDragId)
    : null

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

      <div className="flex flex-col gap-1.5 px-3">
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
        <Button
          variant="ghost"
          onClick={handleNewFolder}
          disabled={pending}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <FolderPlus className="size-4" />
          New Folder
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

      <ScrollArea className="flex-1 px-2">
        {isSearching ? (
          // Flat filtered list while searching — no drag-and-drop
          <ul className="flex flex-col gap-0.5 pb-4">
            {filtered.map((s) => {
              const folder = s.folderId
                ? folders.find((f) => f.id === s.folderId)
                : null
              return (
                <SessionItem
                  key={s.id}
                  session={s}
                  activeId={activeId}
                  folderLabel={folder?.name}
                />
              )
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                No sessions match &ldquo;{query}&rdquo;.
              </li>
            )}
          </ul>
        ) : (
          // Grouped view with drag-and-drop
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col gap-1 pb-4">
              {folders.map((folder) => (
                <FolderSection
                  key={folder.id}
                  folder={folder}
                  sessions={sessions.filter((s) => s.folderId === folder.id)}
                  activeId={activeId}
                  isPendingRename={pendingFolderId === folder.id}
                  onRenameDone={() => setPendingFolderId(null)}
                  onFolderDelete={(id) =>
                    setFolders((prev) => prev.filter((f) => f.id !== id))
                  }
                />
              ))}
              <RootSection
                sessions={sessions.filter((s) => s.folderId === null)}
                activeId={activeId}
                hasFolders={folders.length > 0}
              />
            </div>
            <DragOverlay dropAnimation={null}>
              {draggedSession ? (
                <SessionItemDragOverlay session={draggedSession} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </ScrollArea>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Folder section — droppable header + collapsible list
// ---------------------------------------------------------------------------

function FolderSection({
  folder,
  sessions,
  activeId,
  isPendingRename,
  onRenameDone,
  onFolderDelete,
}: {
  folder: SidebarFolder
  sessions: SidebarSession[]
  activeId: string | null
  isPendingRename: boolean
  onRenameDone: () => void
  onFolderDelete: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: folder.id })

  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(folder.name)
  const [optimisticName, setOptimisticName] = useState(folder.name)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Enter rename mode immediately after folder is created
  useEffect(() => {
    if (isPendingRename && !editing) setEditing(true)
  }, [isPendingRename, editing])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  useEffect(() => {
    setOptimisticName(folder.name)
    setName(folder.name)
  }, [folder.name])

  function commitRename() {
    const next = name.trim()
    setEditing(false)
    onRenameDone()
    if (!next || next === optimisticName) {
      setName(optimisticName)
      return
    }
    setOptimisticName(next)
    startTransition(async () => {
      try {
        await renameFolderAction(folder.id, next)
      } catch {
        setOptimisticName(folder.name)
        setName(folder.name)
      }
    })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commitRename() }
    else if (e.key === 'Escape') {
      e.preventDefault()
      setName(optimisticName)
      setEditing(false)
      onRenameDone()
    }
  }

  function handleDelete() {
    setDeleting(true)
    startTransition(async () => {
      try {
        await deleteFolderAction(folder.id)
        onFolderDelete(folder.id)
      } catch {
        setDeleting(false)
        setConfirmOpen(false)
      }
    })
  }

  return (
    <div>
      <div
        ref={setNodeRef}
        className={cn(
          'group flex items-center gap-1.5 rounded-xl px-2 py-1 transition-colors',
          isOver && 'bg-primary/10 ring-1 ring-primary/30',
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          aria-expanded={open}
        >
          <ChevronRight
            className={cn(
              'size-3 shrink-0 text-muted-foreground/60 transition-transform',
              open && 'rotate-90',
            )}
          />
          {open ? (
            <FolderOpen className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {editing ? (
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              aria-label="Folder name"
              className="min-w-0 flex-1 rounded bg-background/60 px-1 py-0 text-[11px] outline-none ring-1 ring-primary/50"
            />
          ) : (
            <span className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {optimisticName}
            </span>
          )}
          <span className="ml-auto shrink-0 pr-1 text-[10px] text-muted-foreground/50">
            {sessions.length}
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Folder options"
              aria-label="Folder options"
              className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-background/60 hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setEditing(true) }}
            >
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => { e.preventDefault(); setConfirmOpen(true) }}
            >
              <FolderX className="size-4" />
              Delete folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {open && (
        <ul className="flex flex-col gap-0.5 pl-2">
          {sessions.map((s) => (
            <SessionItem key={s.id} session={s} activeId={activeId} />
          ))}
          {sessions.length === 0 && (
            <li className="px-3 py-2 text-[11px] italic text-muted-foreground/50">
              Drag sessions here
            </li>
          )}
        </ul>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{optimisticName}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The folder will be removed. Sessions inside will be moved to
              Unfiled — they won&apos;t be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete() }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Delete folder'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Root (unfiled) drop zone + session list
// ---------------------------------------------------------------------------

function RootSection({
  sessions,
  activeId,
  hasFolders,
}: {
  sessions: SidebarSession[]
  activeId: string | null
  hasFolders: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'root' })

  return (
    <div ref={setNodeRef}>
      {hasFolders ? (
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-xl px-2 py-1 transition-colors',
            isOver && 'bg-primary/10 ring-1 ring-primary/30',
          )}
        >
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Unfiled
          </span>
        </div>
      ) : (
        <p className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Recent sessions
        </p>
      )}
      <ul
        className={cn(
          'flex flex-col gap-0.5',
          hasFolders && 'pl-2',
        )}
      >
        {sessions.map((s) => (
          <SessionItem key={s.id} session={s} activeId={activeId} />
        ))}
        {sessions.length === 0 && (
          <li
            className={
              hasFolders
                ? 'px-3 py-2 text-[11px] italic text-muted-foreground/50'
                : 'px-3 py-6 text-center text-xs text-muted-foreground'
            }
          >
            {hasFolders ? 'No unfiled sessions' : 'No sessions yet'}
          </li>
        )}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Draggable session item
// ---------------------------------------------------------------------------

function SessionItem({
  session,
  activeId,
  folderLabel,
}: {
  session: SidebarSession
  activeId: string | null
  folderLabel?: string
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({ id: session.id })

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
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    else if (e.key === 'Escape') {
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
        if (isActive) router.push('/studio')
        else router.refresh()
      } catch {
        setDeleting(false)
        setConfirmOpen(false)
      }
    })
  }

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: 0.4 }
    : undefined

  const meta = (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span>{session.dateLabel}</span>
      <span className="size-0.5 rounded-full bg-muted-foreground/50" />
      <span>{session.words.toLocaleString()} words</span>
      {folderLabel && (
        <>
          <span className="size-0.5 rounded-full bg-muted-foreground/50" />
          <span className="flex items-center gap-0.5">
            <Folder className="size-2.5" />
            {folderLabel}
          </span>
        </>
      )}
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
    <li
      ref={setNodeRef}
      style={style}
      className={cn('group relative touch-none', isDragging && 'cursor-grabbing')}
      {...attributes}
      {...listeners}
    >
      <Link
        href={`/studio?s=${session.id}`}
        className={cn(
          'flex w-full flex-col gap-1.5 rounded-2xl px-3 py-2.5 text-left transition-colors',
          isActive ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/60',
        )}
        draggable={false}
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
            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
            onPointerDown={(e) => e.stopPropagation()}
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
            onSelect={(e) => { e.preventDefault(); setEditing(true) }}
          >
            <Pencil className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => { e.preventDefault(); setConfirmOpen(true) }}
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
              &ldquo;{optimisticTitle}&rdquo; and its analysis will be
              permanently deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete() }}
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

// ---------------------------------------------------------------------------
// Drag overlay ghost card shown while dragging
// ---------------------------------------------------------------------------

function SessionItemDragOverlay({ session }: { session: SidebarSession }) {
  const dot = STATUS_DOT[session.viewState]
  return (
    <div className="flex w-64 cursor-grabbing flex-col gap-1.5 rounded-2xl bg-sidebar-accent px-3 py-2.5 shadow-lg ring-1 ring-primary/30">
      <div className="flex items-center gap-1.5 truncate text-sm font-medium text-sidebar-accent-foreground">
        {dot && (
          <span className={cn('size-1.5 shrink-0 rounded-full', dot)} aria-hidden />
        )}
        <span className="truncate">{session.title}</span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>{session.dateLabel}</span>
        <span className="size-0.5 rounded-full bg-muted-foreground/50" />
        <span>{session.words.toLocaleString()} words</span>
      </div>
    </div>
  )
}
