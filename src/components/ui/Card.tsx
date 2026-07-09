import type { HTMLAttributes } from 'react'
import { clsx } from '../../lib/clsx'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'bg-card border border-border rounded-xl p-[18px] shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground mb-2.5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
