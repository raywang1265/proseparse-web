import { createHash } from 'node:crypto'

// Stable content hash for manuscript text. Used to detect when an edit has
// invalidated a saved analysis (see the staleness model in schema.ts).
// Normalizes line endings so cosmetic CRLF/LF differences don't register as
// edits, but is otherwise an exact hash of the text.
export function hashContent(text: string): string {
  const normalized = text.replace(/\r\n/g, '\n')
  return createHash('sha256').update(normalized, 'utf8').digest('hex')
}

// Word count used for session metadata / the sidebar.
export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}
