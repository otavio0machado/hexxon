"use client"

import { createContext, useContext, useCallback, useState } from "react"
import { usePathname } from "next/navigation"
import { FloatingButton } from "./floating-button"

interface HexxonAiContextValue {
  openWithMessage: (message: string) => void
  pendingMessage: string | null
  clearPendingMessage: () => void
}

const HexxonAiCtx = createContext<HexxonAiContextValue>({
  openWithMessage: () => {},
  pendingMessage: null,
  clearPendingMessage: () => {},
})

export function useHexxonAI() {
  return useContext(HexxonAiCtx)
}

export function HexxonAiProvider() {
  const pathname = usePathname()
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const openWithMessage = useCallback((message: string) => {
    setPendingMessage(message)
  }, [])

  const clearPendingMessage = useCallback(() => {
    setPendingMessage(null)
  }, [])

  // Don't show floating button on the full HexxonAI page
  const showFloating = pathname !== "/hexxon-ai"

  // Extract discipline/topic from URL if on discipline page
  const disciplineMatch = pathname.match(/^\/disciplina\/(.+)$/)
  const disciplineId = disciplineMatch?.[1]

  return (
    <HexxonAiCtx.Provider value={{ openWithMessage, pendingMessage, clearPendingMessage }}>
      {showFloating && (
        <FloatingButton
          currentPage={pathname}
          disciplineId={disciplineId}
          initialMessage={pendingMessage}
          onMessageConsumed={clearPendingMessage}
        />
      )}
    </HexxonAiCtx.Provider>
  )
}
