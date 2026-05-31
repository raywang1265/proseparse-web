'use client'

import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
} from 'recharts'
import {
  VOICE_SPLIT,
  SENTENCE_LENGTHS,
  STYLE_METRICS,
  DIALOGUE_TAGS,
} from '@/lib/analysis-data'
import { InsightCard } from '../insight-card'

export function StyleTab() {
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
            <AreaChart
              data={SENTENCE_LENGTHS}
              margin={{ top: 6, right: 4, bottom: 0, left: 4 }}
            >
              <defs>
                <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="length"
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#sentGrad)"
              />
            </AreaChart>
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
            const max = DIALOGUE_TAGS[0].count
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
