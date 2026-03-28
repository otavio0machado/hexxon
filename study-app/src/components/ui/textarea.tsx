'use client'

import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-bg-surface px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted transition-colors resize-none',
          'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-accent-danger focus:border-accent-danger focus:ring-accent-danger'
            : 'border-border-default',
          className,
        )}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
