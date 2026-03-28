'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border-default bg-bg-surface p-8 text-center space-y-6">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-accent-danger" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-fg-primary">Algo deu errado</h1>
          <p className="text-sm text-fg-muted">{error.message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={reset}>Tentar novamente</Button>
          <Link href="/dashboard">
            <Button variant="secondary" className="w-full">
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
