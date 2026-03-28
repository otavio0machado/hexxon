'use client'

import { useState } from 'react'
import { Bot, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JarvisTipProps {
  message: string
  actionLabel?: string
  onAction?: () => void
  dismissible?: boolean
  variant?: 'default' | 'warning' | 'success'
  className?: string
}

const variantStyles = {
  default: 'border-l-accent-primary bg-accent-primary/5',
  warning: 'border-l-accent-warning bg-accent-warning/5',
  success: 'border-l-accent-success bg-accent-success/5',
}

export function JarvisTip({
  message,
  actionLabel,
  onAction,
  dismissible = true,
  variant = 'default',
  className,
}: JarvisTipProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border-l-2 border border-border-default px-3 py-2.5',
        variantStyles[variant],
        className,
      )}
    >
      <Bot className="h-4 w-4 mt-0.5 shrink-0 text-accent-primary" />
      <p className="flex-1 text-xs text-fg-secondary leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="shrink-0 rounded-md bg-accent-primary/10 px-2.5 py-1 text-xs font-medium text-accent-primary hover:bg-accent-primary/20 transition-colors"
        >
          {actionLabel}
        </button>
      )}
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-0.5 text-fg-muted hover:text-fg-secondary transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
