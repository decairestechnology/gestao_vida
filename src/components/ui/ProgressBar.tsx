interface ProgressBarProps {
  percent: number
  color?: string
}

export function ProgressBar({ percent, color = 'var(--primary)' }: ProgressBarProps) {
  return (
    <div className="w-full h-1.5 bg-muted rounded overflow-hidden mt-2">
      <div
        className="h-full rounded transition-all"
        style={{ width: `${Math.min(percent, 100)}%`, background: color }}
      />
    </div>
  )
}
