'use client'

/**
 * Landing hero — "ink to chart".
 *
 * The homepage title dissolves into drifting ink and reassembles as a
 * five-axis sensory radar, then flows back into words. Glyph positions are
 * sampled once from an offscreen canvas; from then on it is a plain particle
 * system.
 *
 * The loop is deliberately slow: long holds at each end, long sine-eased
 * transitions between them, and a faint idle shimmer so the held states still
 * breathe rather than freezing.
 */

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Pause, Play } from 'lucide-react'

const LINE = 'Welcome to ProseParse'
const AXES = 5
/** Fraction of each radar axis reached by the plotted value. */
const RADAR_VALUES = [0.92, 0.58, 0.74, 0.36, 0.66]
const MAX_PARTICLES = 2400

const CHART_VARS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
]

// One 22s breath: hold the words, dissolve slowly, hold the chart, flow back.
const CYCLE = 22000
const PHASES = { outStart: 0.1, outEnd: 0.42, backStart: 0.58, backEnd: 0.9 }
/** Latest a particle can start moving, as a fraction of the transition. */
const MAX_LEAD = 0.35

/** Sine ease — gentler through the middle than a cubic, so nothing snaps. */
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t)

/** 0 while the words are held, 1 while the radar is held. */
function morphAmount(p: number) {
  if (p < PHASES.outStart) return 0
  if (p < PHASES.outEnd)
    return ease((p - PHASES.outStart) / (PHASES.outEnd - PHASES.outStart))
  if (p < PHASES.backStart) return 1
  if (p < PHASES.backEnd)
    return 1 - ease((p - PHASES.backStart) / (PHASES.backEnd - PHASES.backStart))
  return 0
}

type Particle = {
  tx: number
  ty: number
  rx: number
  ry: number
  /** perpendicular bow applied mid-flight, so the ink curls rather than slides */
  bow: number
  /** stagger, so the line does not dissolve all at once */
  lead: number
  /** phase offset for the idle shimmer */
  phase: number
}

/** Staggered, bowed interpolation between the word and radar positions. */
function position(
  p: Particle,
  morph: number,
  seconds: number,
): [number, number] {
  const t = Math.max(0, Math.min(1, (morph - p.lead) / (1 - p.lead)))
  const e = ease(t)
  // Never fully still: a sub-pixel drift keeps the held states alive.
  const shimmer = Math.sin(seconds * 0.6 + p.phase)
  return [
    p.tx + (p.rx - p.tx) * e + shimmer * 0.9,
    p.ty + (p.ry - p.ty) * e + Math.sin(e * Math.PI) * p.bow + shimmer * 0.6,
  ]
}

/** Sample the drawn glyphs of `LINE` into a point cloud. */
function sampleText(width: number, height: number, fontFamily: string) {
  const dpr = 2
  const off = document.createElement('canvas')
  off.width = Math.round(width * dpr)
  off.height = Math.round(height * dpr)
  const octx = off.getContext('2d', { willReadFrequently: true })
  if (!octx) return []

  octx.scale(dpr, dpr)
  octx.font = `600 ${Math.min(width / 11, height / 3.2)}px ${fontFamily}`
  octx.textAlign = 'center'
  octx.textBaseline = 'middle'
  octx.fillStyle = '#fff'
  octx.fillText(LINE, width / 2, height * 0.4)

  const { data } = octx.getImageData(0, 0, off.width, off.height)
  const found: { x: number; y: number }[] = []
  const step = 3
  for (let y = 0; y < off.height; y += step) {
    for (let x = 0; x < off.width; x += step) {
      if (data[(y * off.width + x) * 4 + 3] > 140) {
        found.push({ x: x / dpr, y: y / dpr })
      }
    }
  }

  if (found.length <= MAX_PARTICLES) return found
  const stride = found.length / MAX_PARTICLES
  return Array.from(
    { length: MAX_PARTICLES },
    (_, i) => found[Math.floor(i * stride)],
  )
}

/** Points spread along the spokes and outline of the radar polygon. */
function radarPoints(count: number, width: number, height: number) {
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.36
  const vertices = RADAR_VALUES.map((value, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / AXES
    return {
      x: cx + Math.cos(angle) * radius * value,
      y: cy + Math.sin(angle) * radius * value,
    }
  })

  return Array.from({ length: count }, (_, i) => {
    const t = i / count
    const edge = Math.floor(t * AXES)
    const local = t * AXES - edge
    const a = vertices[edge]
    const b = vertices[(edge + 1) % AXES]
    // Every fourth particle rides its spoke instead of the outline.
    return i % 4 === 0
      ? { x: cx + (a.x - cx) * local, y: cy + (a.y - cy) * local, axis: edge }
      : { x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local, axis: edge }
  })
}

export function InkToChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()
  const [paused, setPaused] = useState(false)

  // Read through a ref so pausing does not tear down and re-sample the glyphs.
  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const root = getComputedStyle(document.documentElement)
    const palette = CHART_VARS.map((v) => root.getPropertyValue(v).trim())
    const inkColor = root.getPropertyValue('--foreground').trim()
    const guideColor = root.getPropertyValue('--border').trim()
    const fontFamily = getComputedStyle(canvas).fontFamily || 'Georgia, serif'

    let width = 0
    let height = 0
    let all: Particle[] = []
    // Grouped by radar axis so a frame only sets fillStyle five times.
    let byAxis: Particle[][] = []
    let disposed = false

    const build = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      if (width < 2 || height < 2) return

      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const glyphs = sampleText(width, height, fontFamily)
      const targets = radarPoints(glyphs.length, width, height)

      all = []
      byAxis = Array.from({ length: AXES }, () => [])
      glyphs.forEach((glyph, i) => {
        const target = targets[i]
        const seed = Math.sin(i * 17.31) * 43758.5453
        const r = seed - Math.floor(seed)
        const particle: Particle = {
          tx: glyph.x,
          ty: glyph.y,
          rx: target.x,
          ry: target.y,
          bow: (r - 0.5) * height * 0.28,
          lead: r * MAX_LEAD,
          phase: r * Math.PI * 2,
        }
        all.push(particle)
        byAxis[target.axis].push(particle)
      })
    }

    const drawGuides = (morph: number) => {
      const cx = width / 2
      const cy = height / 2
      const radius = Math.min(width, height) * 0.36
      ctx.globalAlpha = morph * 0.45
      ctx.strokeStyle = guideColor
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i < AXES; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI * 2) / AXES
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
      }
      ctx.stroke()
    }

    const draw = (progress: number, seconds: number) => {
      ctx.clearRect(0, 0, width, height)
      if (all.length === 0) return

      const morph = morphAmount(progress)
      if (morph > 0.05) drawGuides(morph)

      const size = 2

      // Cross-fade: ink while the words hold, chart colours once they scatter.
      if (morph < 0.98) {
        ctx.fillStyle = inkColor
        ctx.globalAlpha = 0.78 * (1 - morph)
        for (const p of all) {
          const [x, y] = position(p, morph, seconds)
          ctx.fillRect(x, y, size, size)
        }
      }

      if (morph > 0.02) {
        for (let axis = 0; axis < AXES; axis++) {
          ctx.fillStyle = palette[axis]
          ctx.globalAlpha = 0.9 * morph
          for (const p of byAxis[axis]) {
            const [x, y] = position(p, morph, seconds)
            ctx.fillRect(x, y, size, size)
          }
        }
      }

      ctx.globalAlpha = 1
    }

    let start = performance.now()
    let pausedAt = 0
    let elapsed = 0
    let frame = 0

    const tick = (now: number) => {
      if (disposed) return
      if (pausedRef.current) {
        if (pausedAt === 0) pausedAt = now
        frame = requestAnimationFrame(tick)
        return
      }
      // Shift the origin forward by the paused interval so the cycle resumes
      // where it stopped instead of jumping ahead.
      if (pausedAt !== 0) {
        start += now - pausedAt
        pausedAt = 0
      }
      elapsed = now - start
      draw((elapsed % CYCLE) / CYCLE, elapsed / 1000)
      frame = requestAnimationFrame(tick)
    }

    // ResizeObserver fires on observe, which does the first build and paint.
    const observer = new ResizeObserver(() => {
      build()
      draw((elapsed % CYCLE) / CYCLE, elapsed / 1000)
    })

    // Sampling glyph pixels before the webfont lands would trace the fallback.
    document.fonts.ready.then(() => {
      if (disposed) return
      observer.observe(canvas)
      frame = requestAnimationFrame(tick)
    })

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [resolvedTheme])

  return (
    <div className="group relative w-full">
      <canvas
        ref={canvasRef}
        className="h-36 w-full font-serif sm:h-44 md:h-52"
        role="img"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => setPaused((on) => !on)}
        aria-label={paused ? 'Play animation' : 'Pause animation'}
        aria-pressed={paused}
        className="absolute bottom-0 right-0 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground/60 opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
      >
        {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
      </button>
    </div>
  )
}
