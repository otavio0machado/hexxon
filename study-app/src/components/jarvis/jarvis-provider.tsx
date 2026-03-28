"use client"

import { createContext, useContext, useCallback, useState } from "react"
import { usePathname } from "next/navigation"
import { FloatingButton } from "./floating-button"

interface JarvisContextValue {
  openWithMessage: (message: string) => void
  pendingMessage: string | null
  clearPendingMessage: () => void
}

const JarvisCtx = createContext<JarvisContextValue>({
  openWithMessage: () => {},
  pendingMessage: null,
  clearPendingMessage: () => {},
})

export function useJarvis() {
  return useContext(JarvisCtx)
}

export function JarvisProvider() {
  const pathname = usePathname()
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const openWithMessage = useCallback((message: string) => {
    setPendingMessage(message)
  }, [])

  const clearPendingMessage = useCallback(() => {
    setPendingMessage(null)
  }, [])

  // Don't show floating button on the full Jarvis page
  const showFloating = pathname !== "/jarvis"

  // Extract discipline/topic from URL if on discipline page
  const disciplineMatch = pathname.match(/^\/disciplina\/(.+)$/)
  const disciplineId = disciplineMatch?.[1]

  return (
    <JarvisCtx.Provider value={{ openWithMessage, pendingMessage, clearPendingMessage }}>
      {showFloating && (
        <FloatingButton
          currentPage={pathname}
          disciplineId={disciplineId}
          initialMessage={pendingMessage}
          onMessageConsumed={clearPendingMessage}
        />
      )}
    </JarvisCtx.Provider>
  )
}
