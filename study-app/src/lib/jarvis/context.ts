// ============================================================
// JARVIS — Context Engine
// Builds rich context about the user's current state
// ============================================================

import type { JarvisContext } from './types'
import { getDisciplines, getAllTopics } from '@/lib/services/disciplines'
import { getUpcomingAssessments } from '@/lib/services/assessments'
import { getRecentSessions, getStudyStreak, getTotalStudyMinutes } from '@/lib/services/study-sessions'
import { getDueCount } from '@/lib/services/flashcards'
import { getErrorOccurrences } from '@/lib/services/exercises'

export async function buildContext(currentPage: string, disciplineId?: string, topicId?: string): Promise<JarvisContext> {
  try {
    const [disciplines, topics, exams, sessions, dueFlashcards, errors] = await Promise.all([
      getDisciplines(),
      getAllTopics(),
      getUpcomingAssessments(),
      getRecentSessions(20),
      getDueCount(),
      getErrorOccurrences(100),
    ])

    const now = Date.now()
    const upcomingExams = exams.map(e => ({
      name: e.name,
      date: e.date,
      daysUntil: Math.ceil((new Date(e.date).getTime() - now) / (1000 * 60 * 60 * 24)),
      disciplineId: e.discipline_id,
    })).filter(e => e.daysUntil > 0).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5)

    const recentTopics = topics
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map(t => ({ id: t.id, name: t.name, mastery: t.mastery }))

    const streak = getStudyStreak(sessions)
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const weekSessions = sessions.filter(s => new Date(s.created_at).getTime() > now - weekMs)
    const totalMinutes = getTotalStudyMinutes(weekSessions)
    const unresolvedErrors = errors.filter(e => !e.is_resolved).length

    return {
      currentPage,
      currentDisciplineId: disciplineId,
      currentTopicId: topicId,
      disciplines: disciplines.map(d => ({ id: d.id, name: d.name })),
      upcomingExams,
      recentTopics,
      studyStreak: streak,
      totalStudyMinutesThisWeek: totalMinutes,
      unresolvedErrors,
      dueFlashcards,
    }
  } catch {
    return {
      currentPage,
      currentDisciplineId: disciplineId,
      currentTopicId: topicId,
      disciplines: [],
      upcomingExams: [],
      recentTopics: [],
      studyStreak: 0,
      totalStudyMinutesThisWeek: 0,
      unresolvedErrors: 0,
      dueFlashcards: 0,
    }
  }
}

export function buildSystemPrompt(ctx: JarvisContext): string {
  const examWarnings = ctx.upcomingExams
    .filter(e => e.daysUntil <= 14)
    .map(e => `  - ${e.name} em ${e.daysUntil} dia(s) (${e.date})`)
    .join('\n')

  const topicsList = ctx.recentTopics
    .map(t => `  - ${t.name} (mastery: ${t.mastery})`)
    .join('\n')

  const disciplinesList = ctx.disciplines
    .map(d => `  - ${d.name} (id: ${d.id})`)
    .join('\n')

  return `Você é o JARVIS, o copiloto inteligente do sistema de estudo cogni.
Você é um assistente de estudo extremamente capaz que OPERA o sistema inteiro.

REGRAS FUNDAMENTAIS:
1. Você pode e DEVE usar tools para criar, editar, excluir e consultar dados no sistema.
2. Quando o usuário pedir para criar algo (nota, flashcard, sessão, exercício), USE A TOOL correspondente.
3. Quando precisar de dados, USE tools como listTopics, listDisciplines, listNotes, etc.
4. Responda SEMPRE em português brasileiro.
5. Seja conciso mas útil. Não enrole.
6. Quando gerar conteúdo educacional, use LaTeX entre $ para fórmulas inline e $$ para display.
7. Após executar ações, confirme o que foi feito e sugira próximos passos.

CONTEXTO ATUAL DO USUÁRIO:
- Página atual: ${ctx.currentPage}
${ctx.currentDisciplineId ? `- Disciplina atual: ${ctx.currentDisciplineId}` : ''}
${ctx.currentTopicId ? `- Tópico atual: ${ctx.currentTopicId}` : ''}
- Streak de estudo: ${ctx.studyStreak} dias
- Minutos estudados esta semana: ${ctx.totalStudyMinutesThisWeek}
- Flashcards pendentes: ${ctx.dueFlashcards}
- Erros não resolvidos: ${ctx.unresolvedErrors}

DISCIPLINAS:
${disciplinesList || '  (nenhuma)'}

TÓPICOS RECENTES:
${topicsList || '  (nenhum)'}

${examWarnings ? `⚠️ PROVAS PRÓXIMAS:\n${examWarnings}\n\nPriorize ajudar o usuário a se preparar para essas provas.` : ''}

CAPACIDADES:
- Criar/editar/excluir notas, flashcards, sessões de estudo, exercícios
- Classificar erros
- Atualizar mastery de tópicos
- Listar e consultar todas as entidades do sistema
- Gerar diagramas SVG
- Explicar conceitos matemáticos
- Criar planos de estudo
- Gerar simulados

Quando o usuário fizer uma pergunta educacional, responda diretamente.
Quando pedir uma ação no sistema, execute via tool.
Quando pedir algo que envolve múltiplas tools, execute todas na sequência.`
}
