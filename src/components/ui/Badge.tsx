import type { HTMLAttributes } from 'react'
import { clsx } from '../../lib/clsx'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'alt' | 'neutral'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        `badge-${variant}`,
        'text-[10.5px] font-bold px-2.5 py-1 rounded-full inline-block',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
