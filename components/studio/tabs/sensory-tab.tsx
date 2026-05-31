'use client'

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { SENSORY } from '@/lib/analysis-data'
import { InsightCard } from '../insight-card'

export function SensoryTab() {
  return (
    <div className="flex flex-col gap-4">
      <InsightCard
        title="Sensory palette"
        subtitle="Balance of the five senses across the scene"
      >
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={SENSORY} outerRadius="72%">
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis
                dataKey="sense"
                tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              />
              <Radar
                dataKey="score"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="var(--color-chart-1)"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </InsightCard>

      <InsightCard title="Sense by sense" subtitle="Detected sensory language">
        <ul className="space-y-2.5">
          {SENSORY.map((s) => (
            <li key={s.sense} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 text-foreground/80">{s.sense}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-chart-1"
                  style={{ width: `${s.score}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-xs tabular-nums text-muted-foreground">
                {s.score}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-md bg-accent/50 px-3 py-2 text-xs leading-relaxed text-accent-foreground">
          Taste and smell are underused. Consider grounding the lighthouse
          interior with an olfactory detail to deepen immersion.
        </p>
      </InsightCard>
    </div>
  )
}
