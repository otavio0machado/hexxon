'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Bot, AlertTriangle, AlertCircle, Info, Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HexxonAiInsight } from '@/lib/services/insights-engine'
import { useHexxonAiAlerts } from '@/hooks/use-hexxon-ai-alerts'
import { Spinner } from '@/components/ui/spinner'

const BRIEFING_CACHE_KEY = 'hexxon-daily-briefing'

const priorityConfig = {
  critical: {
    icon: AlertCircle,
    border: 'border-accent-danger/40',
    bg: 'bg-accent-danger/5',
    iconColor: 'text-accent-danger',
    label: 'Urgente',
  },
  high: {
    icon: AlertTriangle,
    border: 'border-accent-warning/40',
    bg: 'bg-accent-warning/5',
    iconColor: 'text-accent-warning',
    label: 'Importante',
  },
  medium: {
    icon: Info,
    border: 'border-accent-info/30',
    bg: 'bg-accent-info/5',
    iconColor: 'text-accent-info',
    label: 'Atenção',
  },
  low: {
    icon: Sparkles,
    border: 'border-accent-success/30',
    bg: 'bg-accent-success/5',
    iconColor: 'text-accent-success',
    label: 'Conquista',
  },
}

function InsightCard({ insight, onAction }: { insight: HexxonAiInsight; onAction?: (insight: HexxonAiInsight) => void }) {
  const config = priorityConfig[insight.priority]
  const Icon = config.icon

  return (
    <div className={cn('flex items-start gap-3 rounded-lg border px-3 py-2.5', config.border, config.bg)}>
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-fg-primary leading-tight">{insight.title}</p>
        <p className="text-xs text-fg-secondary mt-0.5 line-clamp-2">{insight.body}</p>
      </div>
      {onAction && (
        <button
          onClick={() => onAction(insight)}
          className="shrink-0 rounded-md bg-accent-primary/10 px-2.5 py-1 text-xs font-medium text-accent-primary hover:bg-accent-primary/20 transition-colors"
        >
          Agir
        </button>
      )}
    </div>
  )
}

export function DailyBriefing({ onOpenHexxonAI }: { onOpenHexxonAI?: (message: string) => void }) {
  const { alerts, isLoading, refresh } = useHexxonAiAlerts()
  const [expanded, setExpanded] = useState(true)
  const [hidden, setHidden] = useState(false)

  // Check if already dismissed today
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(BRIEFING_CACHE_KEY)
      if (dismissed === new Date().toDateString()) setHidden(true)
    } catch { /* SSR */ }
  }, [])

  if (hidden || (!isLoading && alerts.length === 0)) return null

  const critical = alerts.filter(a => a.priority === 'critical')
  const high = alerts.filter(a => a.priority === 'high')
  const medium = alerts.filter(a => a.priority === 'medium')
  const low = alerts.filter(a => a.priority === 'low')

  const handleAction = (insight: HexxonAiInsight) => {
    const messages: Record<string, string> = {
      readiness_alert: `Prepara um plano de estudo para "${insight.title.split('—')[0].trim()}"`,
      weakness_pattern: `Gera exercícios focados em erros do tipo ${insight.data?.category ?? 'conceitual'}`,
      flashcard_decay: 'Quais flashcards devo revisar agora?',
      streak_alert: 'Me sugere uma sessão rápida de 10 minutos',
      prerequisite_blocker: `Explica ${insight.title.split(' está')[0]} pra mim`,
      mastery_milestone: 'Qual o próximo passo no meu aprendizado?',
    }
    const msg = messages[insight.type] ?? 'Me ajuda com isso'
    onOpenHexxonAI?.(msg)
  }

  const handleDismissToday = () => {
    setHidden(true)
    try {
      sessionStorage.setItem(BRIEFING_CACHE_KEY, new Date().toDateString())
    } catch { /* SSR */ }
  }

  return (
    <div className="rounded-xl border border-border-default bg-bg-surface overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary/50 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10">
          <Bot className="h-4 w-4 text-accent-primary" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-semibold text-fg-primary">Briefing do Dia</h3>
          <p className="text-xs text-fg-tertiary">
            {isLoading ? 'Analisando...' : `${alerts.length} alerta${alerts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {critical.length > 0 && (
          <span className="rounded-full bg-accent-danger/20 px-2 py-0.5 text-[10px] font-semibold text-accent-danger">
            {critical.length} urgente{critical.length !== 1 ? 's' : ''}
          </span>
        )}
        {expanded ? <ChevronUp className="h-4 w-4 text-fg-muted" /> : <ChevronDown className="h-4 w-4 text-fg-muted" />}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Spinner size="md" />
            </div>
          ) : (
            <>
              {critical.map(a => <InsightCard key={a.id} insight={a} onAction={handleAction} />)}
              {high.map(a => <InsightCard key={a.id} insight={a} onAction={handleAction} />)}
              {medium.map(a => <InsightCard key={a.id} insight={a} onAction={handleAction} />)}
              {low.map(a => <InsightCard key={a.id} insight={a} />)}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleDismissToday}
                  className="text-xs text-fg-muted hover:text-fg-secondary transition-colors"
                >
                  Dispensar por hoje
                </button>
                <button
                  onClick={refresh}
                  className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg-secondary transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  Atualizar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
