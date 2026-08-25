'use client'

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { InsightCard } from '../insight-card'
import type { StudioAnalysis } from '../types'
import type { Sense } from '@/lib/analysis-data'
import { SENSES, SENSE_COLOR } from '@/lib/analysis-data'

/** Opaque fills for bars/chips — highlight tokens are translucent overlays. */
const SENSE_FILL: Record<Sense, string> = {
  sight: SENSE_COLOR.sight.fill,
  sound: SENSE_COLOR.sound.fill,
  touch: SENSE_COLOR.touch.fill,
  smell: SENSE_COLOR.smell.fill,
  taste: SENSE_COLOR.taste.fill,
}

const LABEL_TO_SENSE: Record<string, Sense> = {
  sight: 'sight',
  sound: 'sound',
  touch: 'touch',
  smell: 'smell',
  taste: 'taste',
  visual: 'sight',
  auditory: 'sound',
  tactile: 'touch',
  olfactory: 'smell',
  gustatory: 'taste',
}

function senseKey(label: string): Sense | null {
  return LABEL_TO_SENSE[label.trim().toLowerCase()] ?? null
}

export function SensoryTab({ analysis }: { analysis: StudioAnalysis }) {
  const scores = analysis.sensory
  const spans = analysis.sensorySpans ?? []

  if (scores == null) {
    return (
      <div className="flex flex-col gap-4">
        <InsightCard
          title="Sensory palette"
          subtitle="Balance of the five senses across the scene"
        >
          <p className="py-8 text-center text-sm text-muted-foreground">
            No sensory findings for this draft — either nothing stood out, or
            something went wrong during analysis.
          </p>
        </InsightCard>
      </div>
    )
  }

  const totalHits = spans.length
  const countBySense = SENSES.reduce(
    (acc, s) => {
      acc[s] = spans.filter((sp) => sp.sense === s).length
      return acc
    },
    {} as Record<Sense, number>,
  )
  const allZero = scores.every((s) => s.score === 0) && totalHits === 0

  const chipParts = SENSES.filter((s) => countBySense[s] > 0).map(
    (s) => `${countBySense[s]} ${s}`,
  )

  return (
    <div className="flex flex-col gap-4">
      <InsightCard
        title="Sensory palette"
        subtitle="Balance of the five senses across the scene"
      >
        {allZero ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No sensory cue words were detected in this passage.
          </p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={scores} outerRadius="72%">
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis
                  dataKey="sense"
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="score"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  fill="var(--color-chart-2)"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
        {chipParts.length > 0 && (
          <p className="mt-2 text-center font-mono text-[11px] tabular-nums text-muted-foreground">
            {chipParts.join(' · ')}
          </p>
        )}
      </InsightCard>

      <InsightCard title="Sense by sense" subtitle="Detected sensory language">
        {allZero ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nothing to show yet — try a passage with concrete sensory detail.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {scores.map((s) => {
              const key = senseKey(s.sense)
              const fill = key ? SENSE_FILL[key] : 'var(--color-chart-1)'
              const count = key ? countBySense[key] : 0
              const width = Math.max(0, Math.min(100, Number(s.score) || 0))
              return (
                <li key={s.sense} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 text-foreground/80">
                    {s.sense}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${width}%`, backgroundColor: fill }}
                    />
                  </div>
                  <span className="w-14 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {s.score}
                    {count > 0 ? (
                      <span className="text-muted-foreground/70"> · {count}</span>
                    ) : null}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {analysis.sensoryAdvice && (
          <p className="mt-3 rounded-md bg-accent/50 px-3 py-2 text-xs leading-relaxed text-accent-foreground">
            {analysis.sensoryAdvice}
          </p>
        )}
      </InsightCard>
    </div>
  )
}
