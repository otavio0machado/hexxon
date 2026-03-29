// ============================================================
// Smart Model Router — Auto-selects cheapest model that fits
// ============================================================

import type { ModelId, HexxonAiMessage, HexxonAiContext } from './types'

// Keywords that signal high complexity → need stronger model
const COMPLEX_KEYWORDS = [
  'missão', 'mission', 'plano de estudo', 'study plan',
  'simula', 'simulado', 'exam simulation',
  'analisa todos', 'analyze all',
  'prepara', 'prepare for',
  'cria um plano', 'create a plan',
  'learning path', 'caminho de aprendizado',
]

// Keywords that signal medium complexity
const MEDIUM_KEYWORDS = [
  'explica', 'explain', 'tutor',
  'exercício', 'exercise', 'gera', 'generate',
  'flashcard', 'nota', 'note',
  'erro', 'error', 'diagnóstico',
  'por que', 'como', 'why', 'how',
  'diferença entre', 'difference between',
]

// Simple patterns → cheapest model
const SIMPLE_PATTERNS = [
  /^(oi|olá|hey|hi|bom dia|boa tarde|boa noite)/i,
  /^(obrigad|valeu|thanks|ok|sim|não|entendi)/i,
  /^(lista|mostra|quantos|qual|quais)\b/i,
  /^.{0,30}$/,  // Very short messages
]

export type ModelTier = 'fast' | 'balanced' | 'powerful'

interface RoutingResult {
  model: ModelId
  tier: ModelTier
  reason: string
}

export function selectModel(
  messages: HexxonAiMessage[],
  context?: HexxonAiContext | null,
): RoutingResult {
  const lastMessage = messages[messages.length - 1]
  if (!lastMessage || lastMessage.role !== 'user') {
    return { model: 'claude-sonnet-4-6', tier: 'balanced', reason: 'default' }
  }

  const text = lastMessage.content.toLowerCase()

  // Check for complex patterns first
  if (COMPLEX_KEYWORDS.some(k => text.includes(k))) {
    return {
      model: 'claude-sonnet-4-6',
      tier: 'powerful',
      reason: 'complex query detected',
    }
  }

  // Check for simple patterns
  if (SIMPLE_PATTERNS.some(p => p.test(text))) {
    return {
      model: 'gemini-2.5-flash',
      tier: 'fast',
      reason: 'simple query',
    }
  }

  // Check context for urgency signals
  if (context) {
    const hasUrgentExam = context.upcomingExams?.some(
      e => e.daysUntil <= 3,
    )
    if (hasUrgentExam && (text.includes('prova') || text.includes('exam'))) {
      return {
        model: 'claude-sonnet-4-6',
        tier: 'powerful',
        reason: 'urgent exam context',
      }
    }
  }

  // Medium complexity (most queries)
  if (MEDIUM_KEYWORDS.some(k => text.includes(k))) {
    return {
      model: 'claude-sonnet-4-6',
      tier: 'balanced',
      reason: 'standard educational query',
    }
  }

  // Long messages likely need better understanding
  if (text.length > 200) {
    return {
      model: 'claude-sonnet-4-6',
      tier: 'balanced',
      reason: 'long message',
    }
  }

  // Default: use Flash for cost efficiency
  return {
    model: 'gemini-2.5-flash',
    tier: 'fast',
    reason: 'default routing',
  }
}
