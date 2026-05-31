'use client'

import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import {
  CHARACTERS,
  VOICE_MATRIX,
  DIALOGUE_ISSUES,
  type DialogueIssue,
} from '@/lib/analysis-data'
import { InsightCard } from '../insight-card'
import { cn } from '@/lib/utils'

function similarityFor(a: string, b: string) {
  if (a === b) return null
  const pair = VOICE_MATRIX.find(
    (p) => (p.a === a && p.b === b) || (p.a === b && p.b === a),
  )
  return pair?.similarity ?? null
}

function cellColor(sim: number) {
  // higher similarity = more "warning" (voices too alike)
  if (sim >= 0.7) return 'bg-chart-4/70 text-background'
  if (sim >= 0.5) return 'bg-chart-2/60 text-foreground'
  return 'bg-chart-1/25 text-foreground'
}

export function CharacterTab({
  onSelectBlock,
}: {
  onSelectBlock: (b: number | null) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <InsightCard
        title="Voice similarity matrix"
        subtitle="Vector-embedding distance between character voices"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-center text-xs">
            <thead>
              <tr>
                <th className="w-16" />
                {CHARACTERS.map((c) => (
                  <th
                    key={c}
                    className="px-1 pb-1 font-medium text-muted-foreground"
                  >
                    {c.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHARACTERS.map((row) => (
                <tr key={row}>
                  <th className="pr-1 text-right font-medium text-muted-foreground">
                    {row.split(' ')[0]}
                  </th>
                  {CHARACTERS.map((col) => {
                    const sim = similarityFor(row, col)
                    return (
                      <td key={col}>
                        {sim == null ? (
                          <div className="flex h-9 items-center justify-center rounded-md bg-muted/50 font-mono text-muted-foreground">
                            —
                          </div>
                        ) : (
                          <div
                            className={cn(
                              'flex h-9 items-center justify-center rounded-md font-mono font-medium tabular-nums',
                              cellColor(sim),
                            )}
                          >
                            {sim.toFixed(2)}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Higher scores mean voices read too similarly. <strong className="text-foreground">Eli</strong> and{' '}
          <strong className="text-foreground">The Keeper</strong> (0.83) may be hard to tell apart in dialogue.
        </p>
      </InsightCard>

      <InsightCard
        title="Dialogue clarity"
        subtitle="Coreference & attribution issues"
      >
        <ul className="flex flex-col gap-2">
          {DIALOGUE_ISSUES.map((issue) => (
            <IssueRow key={issue.id} issue={issue} onSelect={onSelectBlock} />
          ))}
        </ul>
      </InsightCard>
    </div>
  )
}

const SEVERITY: Record<
  DialogueIssue['severity'],
  { icon: typeof AlertTriangle; tone: string; label: string }
> = {
  high: { icon: AlertTriangle, tone: 'text-chart-4', label: 'High' },
  medium: { icon: AlertCircle, tone: 'text-chart-2', label: 'Medium' },
  low: { icon: Info, tone: 'text-chart-1', label: 'Low' },
}

function IssueRow({
  issue,
  onSelect,
}: {
  issue: DialogueIssue
  onSelect: (b: number | null) => void
}) {
  const meta = SEVERITY[issue.severity]
  const Icon = meta.icon
  return (
    <li>
      <button
        onClick={() => onSelect(issue.block)}
        className="flex w-full items-start gap-3 rounded-md border border-border bg-background/40 p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
      >
        <Icon className={cn('mt-0.5 size-4 shrink-0', meta.tone)} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{issue.title}</p>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ¶{issue.block + 1}
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {issue.detail}
          </p>
        </div>
      </button>
    </li>
  )
}
