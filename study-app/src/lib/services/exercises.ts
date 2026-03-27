import { supabase, type Exercise, type Attempt, type ErrorOccurrence, type ErrorCategory, type ErrorSeverity } from '../supabase'

// ─── Exercises ──────────────────────────────────────────────────

export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getExercisesByTopic(topicId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('topic_id', topicId)
    .order('difficulty')
  if (error) throw error
  return data ?? []
}

export async function createExercise(exercise: {
  topic_id: string
  discipline_id: string
  statement: string
  type?: Exercise['type']
  difficulty?: number
  options?: Record<string, string> | null
  solution: string
  hints?: string[]
  concepts_tested?: string[]
  ai_generated?: boolean
}): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      topic_id: exercise.topic_id,
      discipline_id: exercise.discipline_id,
      statement: exercise.statement,
      type: exercise.type ?? 'open_ended',
      difficulty: exercise.difficulty ?? 3,
      options: exercise.options ?? null,
      solution: exercise.solution,
      hints: exercise.hints ?? [],
      concepts_tested: exercise.concepts_tested ?? [],
      ai_generated: exercise.ai_generated ?? false,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Attempts ───────────────────────────────────────────────────

export async function getAttempts(limit = 50): Promise<Attempt[]> {
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getAttemptsByTopic(topicId: string): Promise<Attempt[]> {
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createAttempt(attempt: {
  exercise_id: string
  topic_id: string
  student_answer: string
  is_correct: boolean
  time_spent_sec?: number
}): Promise<Attempt> {
  const { data, error } = await supabase
    .from('attempts')
    .insert({
      exercise_id: attempt.exercise_id,
      topic_id: attempt.topic_id,
      student_answer: attempt.student_answer,
      is_correct: attempt.is_correct,
      time_spent_sec: attempt.time_spent_sec ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Error Occurrences ──────────────────────────────────────────

export async function getErrorOccurrences(limit = 50): Promise<ErrorOccurrence[]> {
  const { data, error } = await supabase
    .from('error_occurrences')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getErrorsByDiscipline(disciplineId: string): Promise<ErrorOccurrence[]> {
  const { data, error } = await supabase
    .from('error_occurrences')
    .select('*')
    .eq('discipline_id', disciplineId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createErrorOccurrence(err: {
  attempt_id?: string
  topic_id: string
  discipline_id: string
  category: ErrorCategory
  subcategory?: string
  pattern_id?: string
  severity?: ErrorSeverity
  exercise_statement: string
  student_answer: string
  correct_answer: string
  ai_explanation?: string
  ai_confidence?: number
  root_cause?: string
  remediation?: string
}): Promise<ErrorOccurrence> {
  const { data, error } = await supabase
    .from('error_occurrences')
    .insert({
      attempt_id: err.attempt_id ?? null,
      topic_id: err.topic_id,
      discipline_id: err.discipline_id,
      category: err.category,
      subcategory: err.subcategory ?? null,
      pattern_id: err.pattern_id ?? null,
      severity: err.severity ?? 'medium',
      exercise_statement: err.exercise_statement,
      student_answer: err.student_answer,
      correct_answer: err.correct_answer,
      ai_explanation: err.ai_explanation ?? null,
      ai_confidence: err.ai_confidence ?? null,
      root_cause: err.root_cause ?? null,
      remediation: err.remediation ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function resolveError(id: string): Promise<void> {
  const { error } = await supabase
    .from('error_occurrences')
    .update({ is_resolved: true })
    .eq('id', id)
  if (error) throw error
}
