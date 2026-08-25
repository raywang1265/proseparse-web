import { cn } from '@/lib/utils'
import type { WritingQuote as Quote } from '@/lib/writing-quotes'

// Long quotes get a smaller type ramp so a five-line passage and a one-line
// aphorism occupy roughly the same block of the panel.
function displaySize(text: string) {
  if (text.length > 150) return 'text-[clamp(1.375rem,1.7vw,1.75rem)]'
  if (text.length > 90) return 'text-[clamp(1.5rem,2.1vw,2.125rem)]'
  return 'text-[clamp(1.75rem,2.8vw,2.75rem)]'
}

export function WritingQuote({
  quote,
  className,
  size = 'lg',
}: {
  quote: Quote
  className?: string
  size?: 'lg' | 'sm'
}) {
  const isLarge = size === 'lg'

  return (
    <figure className={cn(isLarge ? 'max-w-2xl' : 'max-w-sm', className)}>
      {isLarge && (
        <span aria-hidden className="mb-8 block h-px w-10 bg-primary/60" />
      )}
      <blockquote
        className={cn(
          'text-pretty font-serif font-medium tracking-tight text-foreground',
          isLarge
            ? cn(displaySize(quote.text), 'leading-[1.18]')
            : 'text-xl leading-snug',
        )}
      >
        &ldquo;{quote.text}&rdquo;
      </blockquote>
      <figcaption
        className={cn(
          'text-muted-foreground',
          isLarge ? 'mt-6 text-sm tracking-wide' : 'mt-4 text-sm',
        )}
      >
        {quote.author}
      </figcaption>
    </figure>
  )
}
