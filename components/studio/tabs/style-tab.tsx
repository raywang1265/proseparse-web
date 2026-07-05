'use client'

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
} from 'recharts'
import { InsightCard } from '../insight-card'
import type { StudioAnalysis } from '../types'

export function StyleTab({ analysis }: { analysis: StudioAnalysis }) {
  const VOICE_SPLIT = analysis.voiceSplit ?? []
  const SENTENCE_LENGTHS = analysis.sentenceLengths ?? []
  const STYLE_METRICS = analysis.styleMetrics ?? []
  const DIALOGUE_TAGS = analysis.dialogueTags ?? []

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
        title="Voice composition"
        subtitle="Active vs. passive constructions"
      >
        <div className="flex items-center gap-4">
          <div className="h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={VOICE_SPLIT}
                  dataKey="value"
                  innerRadius={32}
                  outerRadius={52}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {VOICE_SPLIT.map((s) => (
                    <Cell key={s.name} fill={s.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex-1 space-y-2">
            {VOICE_SPLIT.map((s) => (
              <li key={s.name} className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: s.fill }}
                />
                <span className="text-muted-foreground">{s.name}</span>
                <span className="ml-auto font-mono font-medium tabular-nums">
                  {s.value}%
                </span>
              </li>
            ))}
          </ul>
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
