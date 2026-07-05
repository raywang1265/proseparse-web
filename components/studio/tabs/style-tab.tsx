'use client'

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { InsightCard } from '../insight-card'
import type { StudioAnalysis } from '../types'
import type { Paragraph, VoiceTrendPoint } from '@/lib/analysis-data'

// Fallback: derive per-paragraph active/passive counts from segment kinds when
// the backend hasn't supplied a dedicated voiceTrend series yet.
function deriveVoiceTrend(paragraphs: Paragraph[]): VoiceTrendPoint[] {
  return paragraphs.map((p) => {
    let active = 0
    let passive = 0
    for (const seg of p.segments) {
      if (seg.kind === 'active') active++
      else if (seg.kind === 'passive') passive++
    }
    return { block: p.block, label: `¶${p.block + 1}`, active, passive }
  })
}

export function StyleTab({ analysis }: { analysis: StudioAnalysis }) {
  const SENTENCE_LENGTHS = analysis.sentenceLengths ?? []
  const STYLE_METRICS = analysis.styleMetrics ?? []
  const DIALOGUE_TAGS = analysis.dialogueTags ?? []
  const VOICE_TREND =
    analysis.voiceTrend ?? deriveVoiceTrend(analysis.paragraphs ?? [])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {STYLE_METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-border bg-card p-3"
          >
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {m.label}
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {m.value}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {m.unit}
              </span>
            </p>
          </div>
        ))}
      </div>

      <InsightCard
        title="Active vs. passive voice"
        subtitle="Instances per paragraph"
      >
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={VOICE_TREND}
              margin={{ top: 6, right: 6, bottom: 0, left: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                width={22}
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <Line
                type="monotone"
                dataKey="active"
                stroke="var(--color-chart-5)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="passive"
                stroke="var(--color-chart-4)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-5" />
            Active
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-chart-4" />
            Passive
          </span>
        </div>
      </InsightCard>

      <InsightCard
        title="Sentence length variety"
        subtitle="Distribution of words per sentence"
      >
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={SENTENCE_LENGTHS}
              margin={{ top: 6, right: 4, bottom: 0, left: 4 }}
              barCategoryGap="10%"
            >
              <XAxis
                dataKey="length"
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]} fill="var(--color-chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          words per sentence
        </p>
      </InsightCard>

      <InsightCard
        title="Dialogue tag frequency"
        subtitle="How speech is attributed"
      >
        <ul className="space-y-2">
          {DIALOGUE_TAGS.map((t) => {
            const max = DIALOGUE_TAGS[0]?.count ?? 1
            return (
              <li key={t.tag} className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 font-serif italic text-foreground/80">
                  {t.tag}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-chart-3"
                    style={{ width: `${(t.count / max) * 100}%` }}
                  />
                </div>
                <span className="w-5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {t.count}
                </span>
              </li>
            )
          })}
        </ul>
      </InsightCard>
    </div>
  )
}
