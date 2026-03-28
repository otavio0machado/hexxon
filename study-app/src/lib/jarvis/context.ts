// ============================================================
// JARVIS — Context Engine
// Builds rich context about the user's current state
// ============================================================

import type { JarvisContext, TopicMastery, ErrorBreakdown } from './types'
import { getDisciplines, getAllTopics, getTopic } from '@/lib/services/disciplines'
import { getUpcomingAssessments } from '@/lib/services/assessments'
import { getRecentSessions, getStudyStreak, getTotalStudyMinutes } from '@/lib/services/study-sessions'
import { getDueCount } from '@/lib/services/flashcards'
import { getErrorOccurrences } from '@/lib/services/exercises'
import { getActiveInsights } from '@/lib/services/insights-engine'
import { getUserDocumentsSummary } from '@/lib/documents/search'

export async function buildContext(
  currentPage: string,
  disciplineId?: string,
  topicId?: string,
  noteContent?: string,
  noteTitle?: string,
): Promise<JarvisContext> {
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

    // Build mastery breakdown per topic with discipline names
    const discMap = new Map(disciplines.map(d => [d.id, d.name]))
    const topicMasteries: TopicMastery[] = topics.map(t => ({
      id: t.id,
      name: t.name,
      mastery: t.mastery,
      score: t.score ?? 0,
      disciplineId: t.discipline_id,
      disciplineName: discMap.get(t.discipline_id) ?? '',
    }))

    // Build error breakdown by category with recent examples
    const unresolvedErrs = errors.filter(e => !e.is_resolved)
    const errorMap = new Map<string, { count: number; recentExample?: string }>()
    for (const err of unresolvedErrs) {
      const entry = errorMap.get(err.category) ?? { count: 0 }
      entry.count++
      if (!entry.recentExample) {
        entry.recentExample = err.exercise_statement?.slice(0, 120)
      }
      errorMap.set(err.category, entry)
    }
    const errorBreakdown: ErrorBreakdown[] = Array.from(errorMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.count - a.count)

    // Resolve current discipline/topic names
    let currentDisciplineName: string | undefined
    let currentTopicName: string | undefined
    if (disciplineId) {
      currentDisciplineName = discMap.get(disciplineId)
    }
    if (topicId) {
      const topic = topics.find(t => t.id === topicId)
      currentTopicName = topic?.name
      if (!currentDisciplineName && topic) {
        currentDisciplineName = discMap.get(topic.discipline_id)
      }
    }

    return {
      currentPage,
      currentDisciplineId: disciplineId,
      currentTopicId: topicId,
      currentDisciplineName,
      currentTopicName,
      disciplines: disciplines.map(d => ({ id: d.id, name: d.name })),
      upcomingExams,
      recentTopics,
      studyStreak: streak,
      totalStudyMinutesThisWeek: totalMinutes,
      unresolvedErrors,
      dueFlashcards,
      topicMasteries,
      errorBreakdown,
      currentNoteContent: noteContent,
      currentNoteTitle: noteTitle,
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
      topicMasteries: [],
      errorBreakdown: [],
    }
  }
}

export async function buildSystemPrompt(ctx: JarvisContext): Promise<string> {
  const examWarnings = ctx.upcomingExams
    .filter(e => e.daysUntil <= 14)
    .map(e => `  - ${e.name} em ${e.daysUntil} dia(s) (${e.date})`)
    .join('\n')

  const disciplinesList = ctx.disciplines
    .map(d => `  - ${d.name} (id: ${d.id})`)
    .join('\n')

  // Group mastery by level for a quick overview
  const masteryOverview = buildMasteryOverview(ctx.topicMasteries)

  // Weak topics (none/exposed) — these are where the student needs most help
  const weakTopics = ctx.topicMasteries
    .filter(t => t.mastery === 'none' || t.mastery === 'exposed')
    .slice(0, 8)
    .map(t => `  - ${t.name} (${t.disciplineName}) — ${t.mastery}, score: ${(t.score * 100).toFixed(0)}%`)
    .join('\n')

  // Strong topics
  const strongTopics = ctx.topicMasteries
    .filter(t => t.mastery === 'proficient' || t.mastery === 'mastered')
    .slice(0, 5)
    .map(t => `  - ${t.name} — ${t.mastery}`)
    .join('\n')

  // Error patterns
  const errorPatterns = ctx.errorBreakdown.length > 0
    ? ctx.errorBreakdown.map(e =>
        `  - ${e.category}: ${e.count} erro(s)${e.recentExample ? ` (ex: "${e.recentExample}")` : ''}`
      ).join('\n')
    : '  (nenhum erro pendente)'

  // Current note context
  const noteContext = ctx.currentNoteContent
    ? `\nNOTA ABERTA:\nTítulo: ${ctx.currentNoteTitle ?? '(sem título)'}\nConteúdo (primeiros 2000 chars):\n${ctx.currentNoteContent.slice(0, 2000)}\n`
    : ''

  // Document context
  let documentContext = ''
  try {
    documentContext = await getUserDocumentsSummary()
  } catch {
    // Non-fatal
  }

  return `Você é a Hexxon AI, o copiloto omnisciente da plataforma de estudo Hexxon.
Você não é um chatbot — você é um copiloto que OPERA o sistema inteiro, ANTECIPA necessidades e ORQUESTRA operações complexas.

IDENTIDADE:
- Você é proativo: não espere ser perguntado quando pode agir.
- Você é contextual: sabe exatamente qual página, nota, exercício ou prova o aluno está olhando.
- Você é orquestrador: pode executar múltiplas ações em sequência com um único comando do aluno.
- Você trata o aluno pelo nome: Otávio.

REGRAS FUNDAMENTAIS:
1. USE tools para criar, editar, excluir e consultar dados. Sempre.
2. Responda em português brasileiro. Use LaTeX entre $ (inline) e $$ (display).
3. Seja conciso mas útil. Depois de ações, confirme e sugira próximos passos.
4. Use o contexto atual (disciplina, tópico, página) para resolver parâmetros automaticamente.
5. Quando o aluno dá um OBJETIVO (ex: "tirar 8 na P1"), use createMission para orquestrar tudo.
6. Quando não tiver certeza do contexto, use listTopics/listDisciplines antes de agir.

ESTRATÉGIA PEDAGÓGICA:
- Mastery "none"/"exposed" → básico com analogias, passo a passo
- Mastery "developing" → consolidar, corrigir misconceptions, exercícios guiados
- Mastery "proficient"/"mastered" → desafios avançados, problemas abertos
- Erros recorrentes → aborde proativamente, gere exercícios focados no padrão
- Prefira método socrático: guie com perguntas, não dê respostas diretas

CONTEXTO ATUAL:
- Página: ${ctx.currentPage}
${ctx.currentDisciplineName ? `- Disciplina: ${ctx.currentDisciplineName} (${ctx.currentDisciplineId})` : ''}
${ctx.currentTopicName ? `- Tópico: ${ctx.currentTopicName} (${ctx.currentTopicId})` : ''}
- Streak: ${ctx.studyStreak} dias | Minutos esta semana: ${ctx.totalStudyMinutesThisWeek}
- Flashcards pendentes: ${ctx.dueFlashcards} | Erros não resolvidos: ${ctx.unresolvedErrors}
${noteContext}
DISCIPLINAS:
${disciplinesList || '  (nenhuma)'}

MASTERY:
${masteryOverview}
${weakTopics ? `\nTÓPICOS FRACOS:\n${weakTopics}` : ''}
${strongTopics ? `\nTÓPICOS FORTES:\n${strongTopics}` : ''}

ERROS:
${errorPatterns}

${examWarnings ? `⚠️ PROVAS PRÓXIMAS:\n${examWarnings}` : ''}
${documentContext}
TOOLS — DECISÃO:

📊 DADOS: listNotes, listFlashcards, listExercises, listTopics, listDisciplines, listAssessments, listStudySessions, readNote
✏️ CRUD: createNote, updateNote, deleteNote, createFlashcards, createExercise, createStudySession, submitAttempt, classifyError, updateMastery
🧠 IA ADAPTATIVA: explainTopicAI, tutorAI, generateSmartFlashcards, generateSmartExercises, generateExamPlanAI, summarizeDocumentAI
🎨 VISUAL: generateDiagram, generateMermaidGraph, generateInteractiveBlock
🌐 GRAFO VIVO: findLearningPath, findBlockers, getReadinessReport, checkUnlocks (via knowledge graph)
🔄 FORGETTING CURVE: logLearningEvent, getTodayReviews (repetição espaçada FSRS)
⚡ CONSCIÊNCIA: getDailyBriefing, getInsights, generateInsightsNow (alertas inteligentes)
🎯 SIMULADO: startExamSimulation (simulado completo de prova)
🚀 MISSÃO: createMission (objetivo → plano + exercícios + flashcards + nota, tudo de uma vez), prepareExamKit (kit rápido de prova)

FLUXO DE DECISÃO:
- Aluno dá OBJETIVO ("tirar 8 na P1") → createMission
- Aluno quer se PREPARAR rápido → prepareExamKit
- Aluno abre o app e quer saber o que fazer → getDailyBriefing
- Aluno quer saber seu STATUS para prova → getReadinessReport
- Aluno quer saber O QUE REVISAR hoje → getTodayReviews
- Aluno quer CAMINHO ótimo para um tópico → findLearningPath
- Aluno quer SIMULAR prova → startExamSimulation
- Aluno quer ENTENDER algo → explainTopicAI
- Aluno está TRAVADO em exercício → tutorAI
- Aluno quer VISUALIZAR → generateMermaidGraph ou generateInteractiveBlock
- Aluno compartilhou TEXTO → summarizeDocumentAI

PROATIVIDADE — quando o contexto sugere, OFEREÇA antes de ser pedido:
- Na página de provas → ofereça readiness report ou preparar kit
- Na página de diagnóstico → identifique padrões e sugira exercícios focados
- Na página de notas → sugira completar ou gerar flashcards da nota
- No mapa → explique conexões e sugira learning path
- Se streak está em risco → alerte
- Se flashcards estão vencidos → lembre

Quando o aluno fizer uma pergunta educacional, responda diretamente.
Quando pedir ação, execute via tool(s).
Quando der um objetivo complexo, orquestre múltiplas tools em sequência.`
}

function buildMasteryOverview(masteries: TopicMastery[]): string {
  const counts = { mastered: 0, proficient: 0, developing: 0, exposed: 0, none: 0 }
  for (const t of masteries) {
    if (t.mastery in counts) counts[t.mastery as keyof typeof counts]++
  }
  const total = masteries.length || 1
  const avgScore = masteries.length > 0
    ? (masteries.reduce((s, t) => s + t.score, 0) / masteries.length * 100).toFixed(0)
    : '0'

  return `  Total de tópicos: ${masteries.length}
  Score médio: ${avgScore}%
  Distribuição: ${counts.mastered} mastered, ${counts.proficient} proficient, ${counts.developing} developing, ${counts.exposed} exposed, ${counts.none} sem iniciar`
}
