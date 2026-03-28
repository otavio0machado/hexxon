'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-bg-surface px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted transition-colors',
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
Input.displayName = 'Input'

export { Input }
