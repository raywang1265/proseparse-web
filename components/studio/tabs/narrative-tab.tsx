'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MousePointerClick } from 'lucide-react'
import { InsightCard } from '../insight-card'
import type { StudioAnalysis } from '../types'

export function NarrativeTab({
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
  const TENSION = analysis.tension ?? []
  const PACING = analysis.pacing ?? []
  const EXPOSITION = analysis.exposition ?? []

  return (
    <div className="flex flex-col gap-4">
      <InsightCard
        title="Narrative tension"
        subtitle="Emotional valence & arousal, paragraph by paragraph"
        action={
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/60 px-2 py-0.5 text-[10px] text-muted-foreground">
            <MousePointerClick className="size-3" />
            click a point
          </span>
        }
      >
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={TENSION}
              margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex != null) {
                  onHoverBlock(TENSION[state.activeTooltipIndex]?.block ?? null)
                }
              }}
              onMouseLeave={() => onHoverBlock(null)}
              onClick={(state) => {
                if (state?.activeTooltipIndex != null) {
                  onSelectBlock(TENSION[state.activeTooltipIndex]?.block ?? null)
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
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<TensionTooltip />} cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="arousal"
                name="Arousal"
                stroke="var(--color-chart-4)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="valence"
                name="Valence"
                stroke="var(--color-chart-1)"
                strokeWidth={2.5}
                dot={(props) => {
                  const isActive = TENSION[props.index]?.block === activeBlock
                  return (
                    <circle
                      key={props.index}
                      cx={props.cx}
                      cy={props.cy}
                      r={isActive ? 5 : 0}
                      fill="var(--color-chart-1)"
                      stroke="var(--color-background)"
                      strokeWidth={2}
                    />
                  )
                }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-[11px]">
          <Legend color="var(--color-chart-1)" label="Valence (mood)" />
          <Legend color="var(--color-chart-4)" label="Arousal (intensity)" />
        </div>
      </InsightCard>

      <InsightCard
        title="Pacing pulse"
        subtitle="Action vs. description vs. dialogue per section"
      >
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={PACING}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="section"
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<PacingTooltip />} cursor={{ fill: 'var(--color-accent)', opacity: 0.4 }} />
              <Bar dataKey="action" stackId="a" fill="var(--color-chart-4)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="description" stackId="a" fill="var(--color-chart-2)" />
              <Bar dataKey="dialogue" stackId="a" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-[11px]">
          <Legend color="var(--color-chart-4)" label="Action" />
          <Legend color="var(--color-chart-2)" label="Description" />
          <Legend color="var(--color-chart-1)" label="Dialogue" />
        </div>
      </InsightCard>

      <InsightCard
        title="Exposition balance"
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
              data={EXPOSITION}
              stackOffset="sign"
              margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex != null) {
                  onHoverBlock(EXPOSITION[state.activeTooltipIndex]?.block ?? null)
                }
              }}
              onMouseLeave={() => onHoverBlock(null)}
              onClick={(state) => {
                if (state?.activeTooltipIndex != null) {
                  onSelectBlock(EXPOSITION[state.activeTooltipIndex]?.block ?? null)
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
              <Tooltip content={<ExpositionTooltip />} cursor={{ fill: 'var(--color-accent)', opacity: 0.4 }} />
              <Bar dataKey="indirect" stackId="exp" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]}>
                {EXPOSITION.map((d) => (
                  <Cell
                    key={`i-${d.block}`}
                    fillOpacity={activeBlock == null || activeBlock === d.block ? 1 : 0.35}
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
                {EXPOSITION.map((d) => (
                  <Cell
                    key={`d-${d.block}`}
                    fillOpacity={activeBlock == null || activeBlock === d.block ? 1 : 0.35}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-[11px]">
          <Legend color="var(--color-chart-2)" label="Indirect (showing)" />
          <Legend color="var(--color-chart-4)" label="Direct (telling)" />
        </div>
      </InsightCard>
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

function TensionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">Paragraph {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-mono text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function ExpositionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">Paragraph {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 capitalize text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-mono text-foreground">{Math.abs(p.value)}%</span>
        </p>
      ))}
    </div>
  )
}

function PacingTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 capitalize text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-mono text-foreground">{p.value}%</span>
        </p>
      ))}
    </div>
  )
}
