// ============================================================
// Exam Simulation Engine — Full orchestrated exam simulations
// Creates, runs, evaluates, and tracks mock exams
// ============================================================

import { supabase } from '../supabase'
import { getAssessmentTopicIds } from './assessments'
import { getAllTopics } from './disciplines'
import type { MasteryLevel, ExerciseType } from '../supabase'

// ── Types ───────────────────────────────────────────────────

export interface SimulationQuestion {
  id: string
  exercise_id?: string
  topic_id: string
  topic_name: string
  statement: string
  type: ExerciseType
  difficulty: number
  solution: string
  hints: string[]
  points: number
  // Filled during/after simulation
  student_answer?: string
  is_correct?: boolean
  time_spent_sec?: number
  error_category?: string
}

export interface ExamSimulation {
  id?: string
  assessment_id: string
  assessment_name: string
  total_time_sec: number
  time_limit_sec: number
  score?: number
  questions: SimulationQuestion[]
  ai_analysis?: string
  strategy_tips?: string[]
  readiness_before?: number
  readiness_after?: number
  status: 'preparing' | 'in_progress' | 'completed' | 'analyzed'
  created_at?: string
}

export interface SimulationResult {
  simulation_id: string
  score: number
  total_points: number
  percentage: number
  correct_count: number
  total_questions: number
  time_used_sec: number
  time_limit_sec: number
  error_breakdown: { category: string; count: number }[]
  topic_scores: { topic_name: string; score: number; total: number }[]
  improvement_areas: string[]
}

export interface SimulationHistory {
  id: string
  assessment_name: string
  score: number
  total_questions: number
  percentage: number
  created_at: string
}

// ── Database Operations ─────────────────────────────────────

export async function saveSimulation(sim: ExamSimulation): Promise<ExamSimulation> {
  const { data, error } = await supabase
    .from('exam_simulations')
    .insert({
      assessment_id: sim.assessment_id,
      total_time_sec: sim.total_time_sec,
      time_limit_sec: sim.time_limit_sec,
      score: sim.score,
      questions: sim.questions,
      ai_analysis: sim.ai_analysis,
      strategy_tips: sim.strategy_tips,
      readiness_before: sim.readiness_before,
      readiness_after: sim.readiness_after,
    })
    .select()
    .single()
  if (error) throw error
  return { ...sim, id: data.id, created_at: data.created_at }
}

export async function updateSimulation(id: string, updates: Partial<ExamSimulation>): Promise<void> {
  await supabase.from('exam_simulations').update({
    ...(updates.score !== undefined && { score: updates.score }),
    ...(updates.questions && { questions: updates.questions }),
    ...(updates.ai_analysis && { ai_analysis: updates.ai_analysis }),
    ...(updates.strategy_tips && { strategy_tips: updates.strategy_tips }),
    ...(updates.readiness_after !== undefined && { readiness_after: updates.readiness_after }),
    ...(updates.total_time_sec !== undefined && { total_time_sec: updates.total_time_sec }),
  }).eq('id', id)
}

export async function getSimulation(id: string): Promise<ExamSimulation | null> {
  const { data, error } = await supabase
    .from('exam_simulations')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return { ...data, status: data.ai_analysis ? 'analyzed' : 'completed' } as ExamSimulation
}

export async function getSimulationHistory(assessmentId?: string): Promise<SimulationHistory[]> {
  let query = supabase
    .from('exam_simulations')
    .select('id, assessment_id, score, questions, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (assessmentId) {
    query = query.eq('assessment_id', assessmentId)
  }

  const { data } = await query
  return (data ?? []).map(row => ({
    id: row.id,
    assessment_name: row.assessment_id,
    score: row.score ?? 0,
    total_questions: Array.isArray(row.questions) ? row.questions.length : 0,
    percentage: row.score ? Math.round(row.score * 10) : 0,
    created_at: row.created_at,
  }))
}

// ── Simulation Composition ──────────────────────────────────

/**
 * Compose a simulation by selecting/generating questions for an assessment.
 * Uses existing exercises when available, marks gaps for AI generation.
 */
export async function composeSimulation(
  assessmentId: string,
  assessmentName: string,
  timeLimitMin: number = 90,
  questionCount: number = 5,
): Promise<ExamSimulation> {
  const topicIds = await getAssessmentTopicIds(assessmentId)
  const allTopics = await getAllTopics()
  const topicMap = new Map(allTopics.map(t => [t.id, t]))

  // Distribute questions across topics
  const questionsPerTopic = Math.max(1, Math.floor(questionCount / Math.max(topicIds.length, 1)))
  const questions: SimulationQuestion[] = []
  let qIndex = 0

  // Get existing exercises for these topics
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .in('topic_id', topicIds)
    .order('difficulty', { ascending: true })

  const exercisesByTopic = new Map<string, typeof exercises>()
  for (const ex of exercises ?? []) {
    const list = exercisesByTopic.get(ex.topic_id) ?? []
    list.push(ex)
    exercisesByTopic.set(ex.topic_id, list)
  }

  for (const topicId of topicIds) {
    const topic = topicMap.get(topicId)
    if (!topic) continue

    const topicExercises = exercisesByTopic.get(topicId) ?? []
    const mastery = (topic.mastery ?? 'none') as MasteryLevel

    // Calibrate difficulty by mastery
    const targetDifficulty = mastery === 'none' || mastery === 'exposed' ? 2
      : mastery === 'developing' ? 3
      : 4

    // Select or prepare questions for this topic
    const count = Math.min(questionsPerTopic, Math.max(1, questionCount - questions.length))
    const selected = topicExercises
      .sort((a, b) => Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty))
      .slice(0, count)

    for (const ex of selected) {
      questions.push({
        id: `q_${qIndex++}`,
        exercise_id: ex.id,
        topic_id: topicId,
        topic_name: topic.name,
        statement: ex.statement,
        type: ex.type as ExerciseType,
        difficulty: ex.difficulty,
        solution: ex.solution,
        hints: ex.hints ?? [],
        points: ex.difficulty, // Points proportional to difficulty
      })
    }

    // If not enough exercises, create placeholder for AI generation
    if (selected.length < count) {
      for (let i = selected.length; i < count; i++) {
        questions.push({
          id: `q_${qIndex++}`,
          topic_id: topicId,
          topic_name: topic.name,
          statement: `[AI-generated question about ${topic.name} at difficulty ${targetDifficulty}]`,
          type: 'open_ended',
          difficulty: targetDifficulty,
          solution: '[To be generated]',
          hints: [],
          points: targetDifficulty,
        })
      }
    }
  }

  // Ensure we have the right count
  const finalQuestions = questions.slice(0, questionCount)

  return {
    assessment_id: assessmentId,
    assessment_name: assessmentName,
    total_time_sec: 0,
    time_limit_sec: timeLimitMin * 60,
    questions: finalQuestions,
    status: 'preparing',
  }
}

/**
 * Evaluate a completed simulation and generate results.
 */
export function evaluateSimulation(sim: ExamSimulation): SimulationResult {
  const totalPoints = sim.questions.reduce((s, q) => s + q.points, 0)
  let earnedPoints = 0
  let correctCount = 0
  let totalTime = 0
  const errorBreakdown = new Map<string, number>()
  const topicScores = new Map<string, { score: number; total: number; name: string }>()

  for (const q of sim.questions) {
    const topicEntry = topicScores.get(q.topic_id) ?? { score: 0, total: q.points, name: q.topic_name }
    topicEntry.total = (topicScores.get(q.topic_id)?.total ?? 0) + q.points

    if (q.is_correct) {
      earnedPoints += q.points
      correctCount++
      topicEntry.score += q.points
    } else if (q.error_category) {
      errorBreakdown.set(q.error_category, (errorBreakdown.get(q.error_category) ?? 0) + 1)
    }

    if (q.time_spent_sec) totalTime += q.time_spent_sec
    topicScores.set(q.topic_id, topicEntry)
  }

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

  // Identify improvement areas
  const improvementAreas: string[] = []
  for (const [category, count] of errorBreakdown) {
    if (count >= 2) improvementAreas.push(`Erros ${category}s recorrentes (${count}x)`)
  }
  for (const [, data] of topicScores) {
    if (data.total > 0 && data.score / data.total < 0.5) {
      improvementAreas.push(`${data.name}: score baixo (${Math.round(data.score / data.total * 100)}%)`)
    }
  }

  return {
    simulation_id: sim.id ?? '',
    score: earnedPoints,
    total_points: totalPoints,
    percentage,
    correct_count: correctCount,
    total_questions: sim.questions.length,
    time_used_sec: totalTime,
    time_limit_sec: sim.time_limit_sec,
    error_breakdown: Array.from(errorBreakdown.entries()).map(([category, count]) => ({ category, count })),
    topic_scores: Array.from(topicScores.entries()).map(([, data]) => ({ topic_name: data.name, score: data.score, total: data.total })),
    improvement_areas: improvementAreas,
  }
}
