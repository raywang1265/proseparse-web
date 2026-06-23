import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-xl bg-primary text-primary-foreground',
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[58%]"
      >
        {/* parsed lines of prose */}
        <path d="M5 6h14" />
        <path d="M5 10h9" />
        <path d="M5 14h11" />
        {/* parse marker underlining a passage */}
        <path d="M5 18h6" className="opacity-60" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </svg>
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
