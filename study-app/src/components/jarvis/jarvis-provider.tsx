"use client"

import { usePathname } from "next/navigation"
import { FloatingButton } from "./floating-button"

export function JarvisProvider() {
  const pathname = usePathname()

  // Don't show floating button on the full Jarvis page
  if (pathname === "/jarvis") return null

  // Extract discipline/topic from URL if on discipline page
  const disciplineMatch = pathname.match(/^\/disciplina\/(.+)$/)
  const disciplineId = disciplineMatch?.[1]

  return (
    <FloatingButton
      currentPage={pathname}
      disciplineId={disciplineId}
    />
  )
}
