'use client'

import { useState, useEffect, useCallback } from 'react'
import type { JarvisInsight } from '@/lib/services/insights-engine'

interface UseJarvisAlertsReturn {
  alerts: JarvisInsight[]
  isLoading: boolean
  error: string | null
  dismiss: (id: string) => void
  refresh: () => void
}

const CACHE_KEY = 'hexxon-jarvis-alerts'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(): { alerts: JarvisInsight[]; timestamp: number } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > CACHE_TTL) return null
    return parsed
  } catch {
    return null
  }
}

function setCache(alerts: JarvisInsight[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ alerts, timestamp: Date.now() }))
  } catch { /* quota exceeded */ }
}

export function useJarvisAlerts(): UseJarvisAlertsReturn {
  const [alerts, setAlerts] = useState<JarvisInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const fetchAlerts = useCallback(async (useCache = true) => {
    if (useCache) {
      const cached = getCached()
      if (cached) {
        setAlerts(cached.alerts)
        setIsLoading(false)
        return
      }
    }

    setIsLoading(true)
    try {
      // Generate fresh insights then fetch active ones
      await fetch('/api/jarvis/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })

      const res = await fetch('/api/jarvis/insights')
      if (!res.ok) throw new Error('Failed to fetch alerts')
      const { insights } = await res.json()
      setAlerts(insights ?? [])
      setCache(insights ?? [])
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => new Set(prev).add(id))
    fetch('/api/jarvis/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', insightId: id }),
    }).catch(() => { /* non-critical */ })
  }, [])

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id ?? ''))

  return {
    alerts: visibleAlerts,
    isLoading,
    error,
    dismiss,
    refresh: () => fetchAlerts(false),
  }
}
