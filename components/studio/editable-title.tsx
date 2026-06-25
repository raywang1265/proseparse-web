'use client'

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from 'react'
import { Pencil } from 'lucide-react'
import { renameSessionAction } from '@/app/studio/actions'
import { cn } from '@/lib/utils'

// Inline-editable session title. Click (or the pencil) to edit; Enter saves,
// Escape cancels, blur saves. Optimistically shows the new title while the
// rename action persists + revalidates.
export function EditableTitle({
  sessionId,
  title,
  className,
  inputClassName,
  showPencil = true,
}: {
  sessionId: string
  title: string
  className?: string
  inputClassName?: string
  showPencil?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(title)
  const [optimistic, setOptimistic] = useState(title)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep local state in sync if the title changes from the server.
  useEffect(() => {
    setOptimistic(title)
    setValue(title)
  }, [title])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit() {
    const next = value.trim()
    setEditing(false)
    if (!next || next === optimistic) {
      setValue(optimistic)
      return
    }
    setOptimistic(next)
    startTransition(async () => {
      try {
        await renameSessionAction(sessionId, next)
      } catch {
        setOptimistic(title)
        setValue(title)
      }
    })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setValue(optimistic)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(
          'min-w-0 rounded-md bg-transparent outline-none ring-1 ring-primary/40 focus:ring-primary/60',
          className,
          inputClassName,
        )}
        aria-label="Session title"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Rename"
      className={cn(
        'group/title inline-flex min-w-0 items-center gap-1.5 rounded-md text-left hover:opacity-90',
        className,
      )}
    >
      <span className="truncate">{optimistic}</span>
      {showPencil && (
        <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/title:opacity-100" />
      )}
    </button>
  )
}
