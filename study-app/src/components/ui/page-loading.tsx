'use client'

import { Spinner } from './spinner'

export function PageLoading() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
