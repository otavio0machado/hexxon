'use client'

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-bg-surface px-3 py-2 text-sm text-fg-primary transition-colors appearance-none',
          'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-accent-danger focus:border-accent-danger focus:ring-accent-danger'
            : 'border-border-default',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    )
  },
)
Select.displayName = 'Select'

export { Select }
