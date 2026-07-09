import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: string
  subtitle: string
  action?: ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start gap-4 mb-5.5 mb-[22px]">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
          {eyebrow}
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-[13px] mt-1">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}
