'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MousePointerClick } from 'lucide-react'
import { InsightCard } from '../insight-card'
import { cn } from '@/lib/utils'
import type { StudioAnalysis } from '../types'
import type { ExpositionPoint } from '@/lib/analysis-data'

const TELLING_THRESHOLD = 70

function kindOf(p: ExpositionPoint): 'direct' | 'indirect' {
  return p.kind ?? (p.direct >= 50 ? 'direct' : 'indirect')
}

function pDirectOf(p: ExpositionPoint): number {
  return typeof p.pDirect === 'number' ? p.pDirect : p.direct / 100
}

export function ExpositionTab({
  analysis,
  activeBlock,
  onHoverBlock,
  onSelectBlock,
}: {
  analysis: StudioAnalysis
  activeBlock: number | null
  onHoverBlock: (b: number | null) => void
  onSelectBlock: (b: number | null) => void
}) {
  const points = analysis.exposition

  if (points == null) {
    return (
      <div className="flex flex-col gap-4">
        <InsightCard
          title="Exposition"
          subtitle="Direct telling vs. indirect showing, paragraph by paragraph"
        >
          <p className="py-8 text-center text-sm text-muted-foreground">
            No exposition findings for this draft — either nothing stood out, or
            something went wrong during analysis.
          </p>
        </InsightCard>
      </div>
    )
  }

  const tellPct =
    points.length === 0
      ? 0
      : Math.round(
          (points.reduce((sum, p) => sum + pDirectOf(p), 0) / points.length) *
            100,
        )
  const showPct = 100 - tellPct
  const directCount = points.filter((p) => kindOf(p) === 'direct').length
  const indirectCount = points.length - directCount
  const candidates = points
    .filter((p) => kindOf(p) === 'direct' && p.direct >= TELLING_THRESHOLD)
    .slice()
    .sort((a, b) => b.direct - a.direct)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <MetricTile
          label="Tell %"
          value={String(tellPct)}
          unit="%"
          hint={`Show ${showPct}%`}
        />
        <MetricTile
          label="Split"
          value={`${directCount}`}
          unit="told"
          hint={`${indirectCount} shown`}
        />
        <MetricTile
          label="Telling-heavy"
          value={String(candidates.length)}
          unit="¶"
          hint={`≥ ${TELLING_THRESHOLD}% tell`}
        />
      </div>

      <InsightCard
        title="Exposition"
        subtitle="Direct telling vs. indirect showing, paragraph by paragraph"
        action={
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            <MousePointerClick className="size-3" />
            click a bar
          </span>
        }
      >
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={points}
              stackOffset="sign"
              margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex != null) {
                  onHoverBlock(points[state.activeTooltipIndex]?.block ?? null)
                }
              }}
              onMouseLeave={() => onHoverBlock(null)}
              onClick={(state) => {
                if (state?.activeTooltipIndex != null) {
                  onSelectBlock(points[state.activeTooltipIndex]?.block ?? null)
                }
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[-100, 100]}
                tickFormatter={(v: number) => `${Math.abs(v)}`}
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ReferenceLine y={0} stroke="var(--color-border)" />
              <Tooltip
                content={<ExpositionTooltip />}
                cursor={{ fill: 'var(--color-accent)', opacity: 0.4 }}
              />
              <Bar
                dataKey="indirect"
                stackId="exp"
                fill="var(--color-chart-5)"
                radius={[3, 3, 0, 0]}
              >
                {points.map((d) => (
                  <Cell
                    key={`i-${d.block}`}
                    fillOpacity={
                      activeBlock == null || activeBlock === d.block ? 1 : 0.35
                    }
                  />
                ))}
              </Bar>
              <Bar
                dataKey={(d: { direct: number }) => -d.direct}
                name="direct"
                stackId="exp"
                fill="var(--color-chart-4)"
                radius={[0, 0, 3, 3]}
              >
                {points.map((d) => (
                  <Cell
                    key={`d-${d.block}`}
                    fillOpacity={
                      activeBlock == null || activeBlock === d.block ? 1 : 0.35
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-[11px]">
          <Legend color="var(--color-chart-5)" label="Indirect (showing)" />
          <Legend color="var(--color-chart-4)" label="Direct (telling)" />
        </div>
      </InsightCard>

      <InsightCard
        title="Telling candidates"
        subtitle={`Paragraphs classified as direct with ≥ ${TELLING_THRESHOLD}% tell`}
        action={
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            <MousePointerClick className="size-3" />
            click a row
          </span>
        }
      >
        {candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No heavy telling paragraphs in this pass.
          </p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {candidates.map((p) => {
              const active = activeBlock === p.block
              return (
                <li key={p.block}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/60',
                      active && 'bg-accent/80',
                    )}
                    onMouseEnter={() => onHoverBlock(p.block)}
                    onMouseLeave={() => onHoverBlock(null)}
                    onClick={() => onSelectBlock(p.block)}
                  >
                    <span className="w-10 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {p.label}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-chart-4"
                        style={{ width: `${p.direct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-xs tabular-nums text-foreground">
                      {p.direct}%
                    </span>
                    {p.truncated ? (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        partial
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </InsightCard>
    </div>
  )
}

function MetricTile({
  label,
  value,
  unit,
  hint,
}: {
  label: string
  value: string
  unit: string
  hint: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
        {value}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          {unit}
        </span>
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function ExpositionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as ExpositionPoint | undefined
  const kind = point ? kindOf(point) : null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">
        Paragraph {label}
      </p>
      {payload.map((p: any) => (
        <p
          key={p.name}
          className="flex items-center gap-2 capitalize text-muted-foreground"
        >
          <span
            className="size-2 rounded-full"
            style={{ background: p.color }}
          />
          {p.name}:{' '}
          <span className="font-mono text-foreground">
            {Math.abs(p.value)}%
          </span>
        </p>
      ))}
      {kind ? (
        <p className="mt-1 text-muted-foreground">
          Class:{' '}
          <span className="font-medium capitalize text-foreground">{kind}</span>
        </p>
      ) : null}
      {point?.truncated ? (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Partial — classifier saw the first 384 tokens
        </p>
      ) : null}
    </div>
  )
}
