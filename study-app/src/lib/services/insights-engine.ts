// ============================================================
// Insights Engine — Situational Awareness for Jarvis 3.0
// Generates smart alerts by cross-referencing multiple data sources
// ============================================================

import { supabase } from '../supabase'
import { getDisciplines, getAllTopics } from './disciplines'
import { getUpcomingAssessments, getAssessmentTopicIds } from './assessments'
import { getErrorOccurrences } from './exercises'
import { getDueFlashcards, getDueCount } from './flashcards'
import { getRecentSessions, getStudyStreak, getTotalStudyMinutes } from './study-sessions'
import { getGraphWithMastery, getPrerequisites } from './knowledge-graph'
import { getAllMemoryStates } from './forgetting-curve'
import type { MasteryLevel } from '../supabase'

// ── Types ───────────────────────────────────────────────────

export type InsightType =
  | 'readiness_alert'       // Exam approaching + gaps
  | 'weakness_pattern'      // Recurring error pattern
  | 'diminishing_returns'   // Study fatigue detected
  | 'prerequisite_blocker'  // Graph blocker
  | 'flashcard_decay'       // Flashcards overdue + context
  | 'mastery_milestone'     // Positive achievement
  | 'streak_alert'          // Streak at risk
  | 'daily_briefing'        // Morning briefing

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low'

export interface JarvisInsight {
  id?: string
  type: InsightType
  priority: InsightPriority
  title: string
  body: string
  data?: Record<string, unknown>
  source_tables: string[]
  trigger_event: string
  is_read: boolean
  is_acted_on: boolean
  expires_at?: string
  created_at?: string
}

// ── Database ────────────────────────────────────────────────

export async function getActiveInsights(limit = 20): Promise<JarvisInsight[]> {
  const { data } = await supabase
    .from('jarvis_insights')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as JarvisInsight[]
}

export async function getAllInsights(limit = 50): Promise<JarvisInsight[]> {
  const { data } = await supabase
    .from('jarvis_insights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as JarvisInsight[]
}

export async function saveInsight(insight: Omit<JarvisInsight, 'id' | 'created_at'>): Promise<void> {
  await supabase.from('jarvis_insights').insert(insight)
}

export async function markInsightRead(id: string): Promise<void> {
  await supabase.from('jarvis_insights').update({ is_read: true }).eq('id', id)
}

export async function markInsightActedOn(id: string): Promise<void> {
  await supabase.from('jarvis_insights').update({ is_acted_on: true }).eq('id', id)
}

// ── Insight Generation Engine ───────────────────────────────

/**
 * Run the full cognitive engine and generate all insights.
 * Called daily via cron or on-demand.
 */
export async function generateInsights(triggerEvent: string = 'manual'): Promise<JarvisInsight[]> {
  const insights: JarvisInsight[] = []

  try {
    const [topics, exams, errors, sessions, dueCount, memoryStates] = await Promise.all([
      getAllTopics(),
      getUpcomingAssessments(),
      getErrorOccurrences(100),
      getRecentSessions(30),
      getDueCount(),
      getAllMemoryStates().catch(() => []),
    ])

    const now = Date.now()

    // 1. READINESS ALERTS — Exams approaching with gaps
    for (const exam of exams) {
      const daysUntil = Math.ceil((new Date(exam.date).getTime() - now) / (1000 * 60 * 60 * 24))
      if (daysUntil <= 0 || daysUntil > 21) continue

      let examTopicIds: string[] = []
      try {
        examTopicIds = await getAssessmentTopicIds(exam.id)
      } catch { continue }

      const examTopics = topics.filter(t => examTopicIds.includes(t.id))
      const weakTopics = examTopics.filter(t => t.mastery === 'none' || t.mastery === 'exposed')
      const avgScore = examTopics.length > 0
        ? examTopics.reduce((s, t) => s + (t.score ?? 0), 0) / examTopics.length
        : 0
      const readiness = Math.round(avgScore * 100)

      if (weakTopics.length > 0 || readiness < 70) {
        const priority: InsightPriority = daysUntil <= 3 ? 'critical' : daysUntil <= 7 ? 'high' : 'medium'
        insights.push({
          type: 'readiness_alert',
          priority,
          title: `${exam.name} em ${daysUntil} dia(s) — Readiness: ${readiness}%`,
          body: weakTopics.length > 0
            ? `Tópicos fracos: ${weakTopics.map(t => t.name).join(', ')}. ${daysUntil <= 3 ? 'Modo intensivo recomendado!' : 'Ainda há tempo, mas precisa focar.'}`
            : `Readiness está em ${readiness}%. Continue reforçando.`,
          data: { assessmentId: exam.id, daysUntil, readiness, weakTopicIds: weakTopics.map(t => t.id) },
          source_tables: ['assessments', 'topics', 'assessment_topics'],
          trigger_event: triggerEvent,
          is_read: false,
          is_acted_on: false,
          expires_at: exam.date,
        })
      }
    }

    // 2. WEAKNESS PATTERNS — Recurring errors
    const unresolvedErrors = errors.filter(e => !e.is_resolved)
    const errorByCategory = new Map<string, typeof unresolvedErrors>()
    for (const err of unresolvedErrors) {
      const list = errorByCategory.get(err.category) ?? []
      list.push(err)
      errorByCategory.set(err.category, list)
    }
    for (const [category, errs] of errorByCategory) {
      if (errs.length >= 3) {
        insights.push({
          type: 'weakness_pattern',
          priority: errs.length >= 5 ? 'high' : 'medium',
          title: `Padrão de erro: ${category} (${errs.length} ocorrências)`,
          body: `Você tem ${errs.length} erros ${category}s não resolvidos. Último: "${errs[0].exercise_statement?.slice(0, 80)}...". Exercícios focados podem ajudar.`,
          data: { category, count: errs.length, errorIds: errs.slice(0, 5).map(e => e.id) },
          source_tables: ['error_occurrences'],
          trigger_event: triggerEvent,
          is_read: false,
          is_acted_on: false,
        })
      }
    }

    // 3. PREREQUISITE BLOCKERS — Graph analysis
    try {
      const graph = await getGraphWithMastery()
      for (const node of graph.nodes) {
        const mastery = (node.mastery ?? 'none') as MasteryLevel
        if (mastery !== 'none' && mastery !== 'exposed') continue

        // Check how many dependents this blocks
        const deps = graph.edges.filter(e => e.source_id === node.id && e.kind === 'depends_on')
        if (deps.length >= 2) {
          insights.push({
            type: 'prerequisite_blocker',
            priority: deps.length >= 3 ? 'high' : 'medium',
            title: `${node.label} está bloqueando ${deps.length} tópicos`,
            body: `Seu mastery em "${node.label}" está em "${mastery}". Isso bloqueia o progresso em ${deps.length} outros tópicos. Resolver isso primeiro desbloqueia mais avanço.`,
            data: { nodeId: node.id, dependentCount: deps.length, mastery },
            source_tables: ['kg_nodes', 'kg_edges', 'topics'],
            trigger_event: triggerEvent,
            is_read: false,
            is_acted_on: false,
          })
        }
      }
    } catch { /* graph may not be available */ }

    // 4. FLASHCARD DECAY — Overdue cards with exam context
    if (dueCount > 0) {
      // Check if any due flashcards relate to upcoming exam topics
      const priority: InsightPriority = dueCount > 10 ? 'high' : dueCount > 5 ? 'medium' : 'low'
      insights.push({
        type: 'flashcard_decay',
        priority,
        title: `${dueCount} flashcards vencidos`,
        body: `${dueCount} flashcards precisam de revisão. Cada dia sem revisar reduz a retenção. 10 minutos agora salvam 30 depois.`,
        data: { dueCount },
        source_tables: ['flashcards'],
        trigger_event: triggerEvent,
        is_read: false,
        is_acted_on: false,
      })
    }

    // 5. STREAK ALERT — Streak at risk
    const streak = getStudyStreak(sessions)
    const todaySessions = sessions.filter(s => {
      const d = new Date(s.created_at)
      const today = new Date()
      return d.toDateString() === today.toDateString()
    })
    if (streak > 0 && todaySessions.length === 0) {
      insights.push({
        type: 'streak_alert',
        priority: streak >= 7 ? 'high' : 'medium',
        title: `Streak de ${streak} dias em risco!`,
        body: `Você tem uma sequência de ${streak} dias de estudo. Não perca — uma sessão curta de 10min mantém o ritmo.`,
        data: { streak },
        source_tables: ['study_sessions'],
        trigger_event: triggerEvent,
        is_read: false,
        is_acted_on: false,
      })
    }

    // 6. MASTERY MILESTONES — Positive feedback
    const recentlyMastered = topics.filter(t => {
      if (t.mastery !== 'proficient' && t.mastery !== 'mastered') return false
      const updated = new Date(t.updated_at)
      const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000)
      return updated > twoDaysAgo
    })
    for (const topic of recentlyMastered.slice(0, 3)) {
      insights.push({
        type: 'mastery_milestone',
        priority: 'low',
        title: `${topic.name} — ${topic.mastery}!`,
        body: `Parabéns! Você alcançou "${topic.mastery}" em ${topic.name}. Continue assim.`,
        data: { topicId: topic.id, mastery: topic.mastery },
        source_tables: ['topics'],
        trigger_event: triggerEvent,
        is_read: false,
        is_acted_on: false,
      })
    }

    // Save all insights
    for (const insight of insights) {
      await saveInsight(insight)
    }
  } catch (e) {
    console.error('[Insights Engine Error]', e)
  }

  return insights
}

/**
 * Generate a daily briefing text combining all active insights.
 */
export async function generateDailyBriefing(): Promise<string> {
  const insights = await generateInsights('daily_briefing')
  if (insights.length === 0) return 'Tudo em dia! Nenhum alerta urgente.'

  const critical = insights.filter(i => i.priority === 'critical')
  const high = insights.filter(i => i.priority === 'high')
  const medium = insights.filter(i => i.priority === 'medium')

  let briefing = '## Briefing do Dia\n\n'

  if (critical.length > 0) {
    briefing += '### Urgente\n'
    for (const i of critical) briefing += `- **${i.title}** — ${i.body}\n`
    briefing += '\n'
  }
  if (high.length > 0) {
    briefing += '### Importante\n'
    for (const i of high) briefing += `- **${i.title}** — ${i.body}\n`
    briefing += '\n'
  }
  if (medium.length > 0) {
    briefing += '### Atenção\n'
    for (const i of medium) briefing += `- ${i.title}\n`
    briefing += '\n'
  }

  return briefing
}
