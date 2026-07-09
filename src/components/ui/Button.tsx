import type { ButtonHTMLAttributes } from 'react'
import { clsx } from '../../lib/clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gradient'
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  if (variant === 'gradient') {
    return (
      <button
        className={clsx(
          'px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition hover:opacity-90',
          className,
        )}
        style={{ background: 'linear-gradient(135deg, #06B6D4, #7C3AED)' }}
        {...props}
      >
        {children}
      </button>
    )
  }
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground transition hover:opacity-90',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
