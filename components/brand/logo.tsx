import { cn } from '@/lib/utils'

/** Same five-axis radar as the homepage animation. White strokes, no fill.
 *  Placed so the bounding box of the shape is centred, not the hub. */
function RadarGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g
        stroke="#fff"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="11.73" y1="14.03" x2="11.73" y2="2.4" />
        <line x1="11.73" y1="14.03" x2="18.71" y2="11.77" />
        <line x1="11.73" y1="14.03" x2="17.23" y2="21.6" />
        <line x1="11.73" y1="14.03" x2="9.06" y2="17.71" />
        <line x1="11.73" y1="14.03" x2="3.8" y2="11.45" />
        <path d="M11.73 2.4 18.71 11.77 17.23 21.6 9.06 17.71 3.8 11.45Z" />
      </g>
    </svg>
  )
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-xl bg-primary',
        className,
      )}
      aria-hidden="true"
    >
      <RadarGlyph className="size-[80%]" />
    </span>
  )
}

export function Logo({
  className,
  markClassName,
  wordmark = true,
}: {
  className?: string
  markClassName?: string
  wordmark?: boolean
}) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <LogoMark className={cn('size-7', markClassName)} />
      {wordmark && (
        <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
          Prose<span className="text-primary">Parse</span>
        </span>
      )}
    </span>
  )
}
