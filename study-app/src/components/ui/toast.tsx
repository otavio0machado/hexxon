'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastContextValue {
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-accent-success/30 bg-accent-success/10 text-accent-success',
  error: 'border-accent-danger/30 bg-accent-danger/10 text-accent-danger',
  warning: 'border-accent-warning/30 bg-accent-warning/10 text-accent-warning',
  info: 'border-accent-info/30 bg-accent-info/10 text-accent-info',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = icons[toast.variant]

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-dropdown animate-in slide-in-from-top-2 fade-in',
        variantStyles[toast.variant],
      )}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <p className="flex-1 text-sm font-medium text-fg-primary">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 hover:bg-bg-secondary transition-colors"
      >
        <X className="h-3.5 w-3.5 text-fg-muted" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, variant: ToastVariant, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev.slice(-4), { id, message, variant, duration }])
  }, [])

  const value: ToastContextValue = {
    success: useCallback((msg, dur) => addToast(msg, 'success', dur), [addToast]),
    error: useCallback((msg, dur) => addToast(msg, 'error', dur ?? 6000), [addToast]),
    warning: useCallback((msg, dur) => addToast(msg, 'warning', dur), [addToast]),
    info: useCallback((msg, dur) => addToast(msg, 'info', dur), [addToast]),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}
