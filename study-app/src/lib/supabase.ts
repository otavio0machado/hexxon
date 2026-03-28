import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  _supabase = createClient(url, key)
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

// ─── Shared Types ───────────────────────────────────────────────

export type MasteryLevel = 'none' | 'exposed' | 'developing' | 'proficient' | 'mastered'
export type AssessmentType = 'prova' | 'trabalho' | 'ps' | 'g2'
export type AssessmentStatus = 'upcoming' | 'ready' | 'completed'
export type NodeKind = 'concept' | 'formula' | 'theorem'
export type EdgeKind = 'depends_on' | 'connects' | 'appears_in_exam'
export type ExerciseType = 'multiple_choice' | 'open_ended' | 'proof' | 'computation'
export type ErrorCategory = 'conceptual' | 'algebraic' | 'logical' | 'interpretation' | 'formalization'
export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low'
export type NoteFormat = 'cornell' | 'outline' | 'concept_map' | 'summary' | 'free'
export type ContentStatus = 'draft' | 'review' | 'done'
export type FlashcardType = 'definition' | 'theorem' | 'procedure' | 'example'
export type OralDifficulty = 'easy' | 'medium' | 'hard'
export type SessionKind = 'study' | 'exercise' | 'review' | 'simulation' | 'flashcard'

// ─── Row Types ──────────────────────────────────────────────────

export interface Discipline {
  id: string
  code: string
  name: string
  professor: string
  schedule: string
  grading_formula: string
  approval_criteria: string
  color: string
  created_at: string
}

export interface Module {
  id: string
  discipline_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Topic {
  id: string
  module_id: string
  discipline_id: string
  name: string
  description: string | null
  mastery: MasteryLevel
  score: number
  exercises_attempted: number
  exercises_available: number
  error_count: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Assessment {
  id: string
  discipline_id: string
  type: AssessmentType
  name: string
  date: string
  weight: number
  is_cumulative: boolean
  status: AssessmentStatus
  score: number | null
  created_at: string
}

export interface AssessmentTopic {
  assessment_id: string
  topic_id: string
}

export interface KgNode {
  id: string
  topic_id: string | null
  label: string
  kind: NodeKind
  discipline_id: string
  module_id: string
  description: string | null
  latex: string | null
  x: number
  y: number
  created_at: string
}

export interface KgEdge {
  id: string
  source_id: string
  target_id: string
  kind: EdgeKind
  label: string | null
  weight: number
  created_at: string
}

export interface Exercise {
  id: string
  topic_id: string
  discipline_id: string
  statement: string
  type: ExerciseType
  difficulty: number
  options: Record<string, string> | null
  solution: string
  hints: string[]
  concepts_tested: string[]
  ai_generated: boolean
  created_at: string
}

export interface Attempt {
  id: string
  exercise_id: string
  topic_id: string
  student_answer: string
  is_correct: boolean
  time_spent_sec: number | null
  created_at: string
}

export interface ErrorOccurrence {
  id: string
  attempt_id: string | null
  topic_id: string
  discipline_id: string
  category: ErrorCategory
  subcategory: string | null
  pattern_id: string | null
  severity: ErrorSeverity
  exercise_statement: string
  student_answer: string
  correct_answer: string
  ai_explanation: string | null
  ai_confidence: number | null
  root_cause: string | null
  remediation: string | null
  is_resolved: boolean
  created_at: string
}

export interface Note {
  id: string
  topic_id: string
  discipline_id: string
  title: string
  content: string
  format: NoteFormat
  status: ContentStatus
  key_concepts: string[]
  linked_topics: string[]
  tags: string[]
  ai_generated: boolean
  created_at: string
  updated_at: string
}

export interface Flashcard {
  id: string
  topic_id: string
  discipline_id: string
  front: string
  back: string
  type: FlashcardType
  difficulty: number
  sr_box: number
  next_review: string
  times_reviewed: number
  times_correct: number
  tags: string[]
  ai_generated: boolean
  created_at: string
  updated_at: string
}

export interface OralQuestion {
  id: string
  topic_id: string
  discipline_id: string
  question: string
  expected_points: string[]
  model_answer: string
  difficulty: OralDifficulty
  related_concepts: string[]
  tags: string[]
  ai_generated: boolean
  created_at: string
}

export interface StudySession {
  id: string
  topic_id: string | null
  discipline_id: string | null
  kind: SessionKind
  duration_min: number
  exercises_attempted: number
  exercises_correct: number
  notes: string | null
  created_at: string
}

// ── Tasks ──────────────────────────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high'

export interface TaskAttachment {
  type: 'image' | 'code' | 'link' | 'file'
  url?: string
  content?: string
  label?: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  date: string                        // YYYY-MM-DD
  start_time: string | null           // HH:MM
  end_time: string | null             // HH:MM
  is_completed: boolean
  priority: TaskPriority
  discipline_id: string | null
  attachments: TaskAttachment[]
  created_at: string
}

export interface AiUsageLog {
  id: string
  service: string
  model: string
  input_tokens: number
  output_tokens: number
  estimated_cost_usd: number
  duration_ms: number
  created_at: string
}
