import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function InsightCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-border/50 bg-card/60 p-5',
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
