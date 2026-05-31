'use client'

type SparklineProps = {
  data: number[]
  className?: string
  active?: boolean
}

export function Sparkline({ data, className, active }: SparklineProps) {
  const width = 72
  const height = 22
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 2) - 1
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={active ? 'var(--color-primary)' : 'var(--color-muted-foreground)'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.6}
      />
    </svg>
  )
}
