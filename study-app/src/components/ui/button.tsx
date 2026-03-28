'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Spinner } from './spinner'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent-primary text-white hover:bg-accent-primary/90',
        secondary: 'bg-bg-secondary text-fg-primary border border-border-default hover:bg-bg-tertiary',
        ghost: 'text-fg-secondary hover:bg-bg-secondary hover:text-fg-primary',
        danger: 'bg-accent-danger text-white hover:bg-accent-danger/90',
        outline: 'border border-border-default text-fg-primary hover:bg-bg-secondary',
      },
      size: {
        sm: 'h-8 rounded-md px-3 text-xs',
        md: 'h-9 rounded-lg px-4 text-sm',
        lg: 'h-11 rounded-lg px-6 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size="sm" className="text-current" />}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
