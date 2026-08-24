'use client'

import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import {
  Bar,
  BarChart,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  type DialogueIssue,
  type CharacterPair,
  type VoiceProfile,
  POS_LABELS,
} from '@/lib/analysis-data'
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { InsightCard } from '../insight-card'
import { cn } from '@/lib/utils'
import type { StudioAnalysis } from '../types'

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

const RADAR_CHAR_CAP = 5

function shortName(name: string) {
  return name.split(' ')[0]
}

function similarityFor(matrix: CharacterPair[], a: string, b: string) {
  if (a === b) return null
  return (
    matrix.find(
      (p) => (p.a === a && p.b === b) || (p.a === b && p.b === a),
    ) ?? null
  )
}

function cellColor(sim: number) {
  if (sim >= 0.7) return 'bg-chart-4/70 text-background'
  if (sim >= 0.5) return 'bg-chart-2/60 text-foreground'
  return 'bg-chart-1/25 text-foreground'
}

function MatrixPairTooltip({ pair }: { pair: CharacterPair }) {
  const rows: { label: string; value: number | undefined; total?: boolean }[] = [
    { label: 'Theme', value: pair.semSim },
    { label: 'Diction', value: pair.styleSim },
    { label: 'Vocabulary', value: pair.vocabSim },
    { label: 'Combined', value: pair.similarity, total: true },
  ]
  return (
    <div className="grid min-w-[8.5rem] gap-1 text-left">
      <p className="mb-0.5 font-medium text-popover-foreground">
        {shortName(pair.a)} · {shortName(pair.b)}
      </p>
      {rows.map((row) => (
        <p
          key={row.label}
          className={cn(
            'flex items-center justify-between gap-6 text-muted-foreground',
            row.total && 'mt-0.5 border-t border-border/60 pt-1 font-medium',
          )}
        >
          <span>{row.label}</span>
          <span className="font-mono tabular-nums text-foreground">
            {row.value == null ? '—' : row.value.toFixed(2)}
          </span>
        </p>
      ))}
    </div>
  )
}

function buildRadarData(profiles: VoiceProfile[]) {
  const shown = profiles.slice(0, RADAR_CHAR_CAP)
  if (shown.length === 0) return []
  const tags = shown[0].posRates.map((p) => p.tag)
  return tags.map((tag) => {
    const row: Record<string, string | number> = {
      tag: POS_LABELS[tag] ?? tag,
    }
    for (const p of shown) {
      row[p.name] = p.posRates.find((r) => r.tag === tag)?.rate ?? 0
    }
    return row
  })
}

function buildDictionBars(profiles: VoiceProfile[]) {
  const shown = profiles.slice(0, RADAR_CHAR_CAP)
  const metrics: { key: keyof VoiceProfile; label: string }[] = [
    { key: 'avgSentenceLength', label: 'Avg. sentence' },
    { key: 'lexicalDiversity', label: 'Type–token ratio' },
    { key: 'contractionDensity', label: 'Contractions' },
    { key: 'questionRate', label: 'Questions' },
    { key: 'exclamationRate', label: 'Exclamations' },
  ]
  return metrics.map(({ key, label }) => {
    const row: Record<string, string | number> = { metric: label }
    for (const p of shown) {
      const v = p[key]
      row[p.name] = typeof v === 'number' ? v : 0
    }
    return row
  })
}

export function CharacterTab({
  analysis,
  onSelectBlock,
}: {
  analysis: StudioAnalysis
  onSelectBlock: (b: number | null) => void
}) {
  const characters = analysis.characters ?? []
  const voiceMatrix = analysis.voiceMatrix ?? []
  const voiceProfiles = analysis.voiceProfiles ?? []
  const dialogueIssues = analysis.dialogueIssues ?? []

  const hasVoice =
    characters.length > 0 ||
    voiceProfiles.length > 0 ||
    voiceMatrix.length > 0

  if (!hasVoice) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No voice analysis yet. Run{' '}
          <strong className="text-foreground">Re-analyze</strong> with the
          analysis backend configured to extract character voices.
        </p>
      </div>
    )
  }

  const radarData = buildRadarData(voiceProfiles)
  const dictionData = buildDictionBars(voiceProfiles)
  const radarNames = voiceProfiles.slice(0, RADAR_CHAR_CAP).map((p) => p.name)

  return (
    <div className="flex flex-col gap-4">
      <InsightCard
        title="Voice similarity matrix"
        subtitle="How alike characters sound (theme + diction + vocabulary)"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-center text-xs">
            <thead>
              <tr>
                <th className="w-16" />
                {characters.map((c) => (
                  <th
                    key={c}
                    className="px-1 pb-1 font-medium text-muted-foreground"
                  >
                    {shortName(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {characters.map((row) => (
                <tr key={row}>
                  <th className="pr-1 text-right font-medium text-muted-foreground">
                    {shortName(row)}
                  </th>
                  {characters.map((col) => {
                    const pair = similarityFor(voiceMatrix, row, col)
                    return (
                      <td key={col}>
                        {pair == null ? (
                          <div className="flex h-9 items-center justify-center rounded-md bg-muted/50 font-mono text-muted-foreground">
                            —
                          </div>
                        ) : (
                          <UiTooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  'flex h-9 w-full items-center justify-center rounded-md font-mono font-medium tabular-nums',
                                  cellColor(pair.similarity),
                                )}
                              >
                                {pair.similarity.toFixed(2)}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              sideOffset={6}
                              className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md [&_.rotate-45]:hidden"
                            >
                              <MatrixPairTooltip pair={pair} />
                            </TooltipContent>
                          </UiTooltip>
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
          Higher values mean more similar voices. Scores range from 0 to 1.
        </p>
      </InsightCard>

      {radarData.length > 0 && radarNames.length >= 1 ? (
        <InsightCard
          title="Syntax habits"
          subtitle="POS rates in dialogue — overlapping shapes sound alike"
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis
                  dataKey="tag"
                  tick={{
                    fontSize: 10,
                    fill: 'var(--color-muted-foreground)',
                  }}
                />
                {radarNames.map((name, i) => (
                  <Radar
                    key={name}
                    name={shortName(name)}
                    dataKey={name}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    fillOpacity={0.12}
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="circle"
                  iconSize={8}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {voiceProfiles.length > RADAR_CHAR_CAP ? (
            <p className="mt-1 text-center text-[11px] text-muted-foreground">
              Showing top {RADAR_CHAR_CAP} by dialogue volume
            </p>
          ) : null}
        </InsightCard>
      ) : null}

      {dictionData.length > 0 && radarNames.length >= 1 ? (
        <InsightCard
          title="Diction comparison"
          subtitle="Length-normalized style rates"
        >
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dictionData}
                margin={{ top: 6, right: 4, bottom: 0, left: 0 }}
                barCategoryGap="18%"
              >
                <XAxis
                  dataKey="metric"
                  tick={{
                    fontSize: 10,
                    fill: 'var(--color-muted-foreground)',
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  width={28}
                  tick={{
                    fontSize: 10,
                    fill: 'var(--color-muted-foreground)',
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-foreground)', fillOpacity: 0.04 }}
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card)',
                  }}
                />
                {radarNames.map((name, i) => (
                  <Bar
                    key={name}
                    name={shortName(name)}
                    dataKey={name}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </InsightCard>
      ) : null}

      {voiceProfiles.length > 0 ? (
        <InsightCard title="Cast" subtitle="Dialogue volume and key rates">
          <ul className="flex flex-col gap-2">
            {voiceProfiles.map((p, i) => (
              <li
                key={p.name}
                className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    background: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {p.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {p.wordCount} words · avg sentence {p.avgSentenceLength} ·
                    type–token {p.lexicalDiversity} · contractions{' '}
                    {p.contractionDensity}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </InsightCard>
      ) : null}

      {dialogueIssues.length > 0 ? (
        <InsightCard
          title="Voice notes"
          subtitle="Similarity warnings and attribution gaps"
        >
          <ul className="flex flex-col gap-2">
            {dialogueIssues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                onSelect={onSelectBlock}
              />
            ))}
          </ul>
        </InsightCard>
      ) : null}
    </div>
  )
}

const SEVERITY: Record<
  DialogueIssue['severity'],
  { icon: typeof AlertTriangle; tone: string }
> = {
  high: { icon: AlertTriangle, tone: 'text-chart-4' },
  medium: { icon: AlertCircle, tone: 'text-chart-2' },
  low: { icon: Info, tone: 'text-chart-1' },
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
  const tethered = issue.block != null

  const body = (
    <>
      <Icon className={cn('mt-0.5 size-4 shrink-0', meta.tone)} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{issue.title}</p>
          {tethered ? (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ¶{issue.block! + 1}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {issue.detail}
        </p>
      </div>
    </>
  )

  if (tethered) {
    return (
      <li>
        <button
          type="button"
          onClick={() => onSelect(issue.block)}
          className="flex w-full items-start gap-3 rounded-md border border-border bg-background/40 p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
        >
          {body}
        </button>
      </li>
    )
  }

  return (
    <li className="flex items-start gap-3 rounded-md border border-border bg-background/40 p-3">
      {body}
    </li>
  )
}
