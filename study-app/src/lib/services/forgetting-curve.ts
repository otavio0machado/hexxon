// ============================================================
// Forgetting Curve Engine — FSRS-inspired spaced repetition
// Tracks memory state per topic and schedules optimal reviews
// ============================================================

import { supabase } from '../supabase'

// ── Types ───────────────────────────────────────────────────

export interface LearningEvent {
  id?: string
  topic_id: string
  event_type: 'flashcard_review' | 'exercise_attempt' | 'note_read' | 'oral_practice' | 'explanation_received' | 'simulation_question'
  quality: number // 0=forgot, 1=hard, 2=ok, 3=good, 4=easy, 5=perfect
  source_id?: string
  created_at?: string
}

export interface TopicMemoryState {
  topic_id: string
  stability: number       // days until 90% forgetting
  difficulty: number      // 0-1, intrinsic difficulty for this student
  last_review: string | null
  next_optimal_review: string | null
  retention_estimate: number // current estimated retention 0-1
  review_count: number
}

export interface ReviewItem {
  topic_id: string
  topic_name: string
  retention_estimate: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  days_overdue: number
  suggested_activity: string
  source_type: string
  source_id?: string
}

// ── FSRS Constants ──────────────────────────────────────────

const DECAY = -0.5
const FACTOR = 19 / 81 // 0.9^(1/DECAY) - 1
const INITIAL_STABILITY = 1.0
const INITIAL_DIFFICULTY = 0.5
const TARGET_RETENTION = 0.9

// ── FSRS Algorithm ──────────────────────────────────────────

/**
 * Calculate current retention based on time elapsed and stability.
 * R(t) = (1 + FACTOR * t/S)^DECAY
 */
function calculateRetention(stabilityDays: number, elapsedDays: number): number {
  if (stabilityDays <= 0 || elapsedDays <= 0) return 1.0
  return Math.pow(1 + FACTOR * elapsedDays / stabilityDays, DECAY)
}

/**
 * Calculate next stability after a review.
 * Good review increases stability; poor review decreases it.
 */
function nextStability(prevStability: number, difficulty: number, quality: number): number {
  if (quality >= 3) {
    // Successful recall — stability increases
    const modifier = 1 + (6 - difficulty * 5) * Math.pow(prevStability, -0.2) * (Math.exp(quality - 3) - 1) * 0.2
    return Math.max(prevStability * Math.max(modifier, 1.1), prevStability + 0.5)
  } else {
    // Failed recall — stability decreases
    return Math.max(INITIAL_STABILITY, prevStability * 0.5 * (1 + 0.1 * quality))
  }
}

/**
 * Update difficulty based on review quality.
 */
function nextDifficulty(prevDifficulty: number, quality: number): number {
  const delta = (quality - 3) * 0.1
  return Math.max(0.01, Math.min(1.0, prevDifficulty - delta))
}

/**
 * Calculate days until retention drops to target.
 */
function daysUntilTargetRetention(stability: number): number {
  return Math.max(1, Math.round(stability * (Math.pow(TARGET_RETENTION, 1 / DECAY) - 1) / FACTOR))
}

// ── Database Operations ─────────────────────────────────────

export async function logLearningEvent(event: LearningEvent): Promise<void> {
  await supabase.from('learning_events').insert({
    topic_id: event.topic_id,
    event_type: event.event_type,
    quality: event.quality,
    source_id: event.source_id,
  })
}

export async function getTopicMemoryState(topicId: string): Promise<TopicMemoryState | null> {
  const { data, error } = await supabase
    .from('topic_memory_state')
    .select('*')
    .eq('topic_id', topicId)
    .single()
  if (error && error.code !== 'PGRST116') return null
  return data
}

export async function getAllMemoryStates(): Promise<TopicMemoryState[]> {
  const { data } = await supabase
    .from('topic_memory_state')
    .select('*')
    .order('retention_estimate', { ascending: true })
  return data ?? []
}

export async function upsertMemoryState(state: TopicMemoryState): Promise<void> {
  await supabase.from('topic_memory_state').upsert(state, { onConflict: 'topic_id' })
}

// ── Core Operations ─────────────────────────────────────────

/**
 * Process a learning event and update the topic's memory state.
 */
export async function processLearningEvent(event: LearningEvent): Promise<TopicMemoryState> {
  await logLearningEvent(event)

  let state = await getTopicMemoryState(event.topic_id)

  if (!state) {
    state = {
      topic_id: event.topic_id,
      stability: INITIAL_STABILITY,
      difficulty: INITIAL_DIFFICULTY,
      last_review: null,
      next_optimal_review: null,
      retention_estimate: 1.0,
      review_count: 0,
    }
  }

  // Update FSRS parameters
  const newStability = nextStability(state.stability, state.difficulty, event.quality)
  const newDifficulty = nextDifficulty(state.difficulty, event.quality)
  const daysUntilReview = daysUntilTargetRetention(newStability)
  const now = new Date()
  const nextReview = new Date(now.getTime() + daysUntilReview * 24 * 60 * 60 * 1000)

  const updated: TopicMemoryState = {
    topic_id: event.topic_id,
    stability: Math.round(newStability * 100) / 100,
    difficulty: Math.round(newDifficulty * 100) / 100,
    last_review: now.toISOString(),
    next_optimal_review: nextReview.toISOString(),
    retention_estimate: 1.0, // Just reviewed
    review_count: state.review_count + 1,
  }

  await upsertMemoryState(updated)
  return updated
}

/**
 * Recalculate current retention for all topics.
 */
export async function refreshRetentionEstimates(): Promise<TopicMemoryState[]> {
  const states = await getAllMemoryStates()
  const now = Date.now()
  const updated: TopicMemoryState[] = []

  for (const state of states) {
    if (!state.last_review) continue
    const elapsedMs = now - new Date(state.last_review).getTime()
    const elapsedDays = elapsedMs / (24 * 60 * 60 * 1000)
    const retention = calculateRetention(state.stability, elapsedDays)

    const newState = { ...state, retention_estimate: Math.round(retention * 100) / 100 }
    updated.push(newState)
    await upsertMemoryState(newState)
  }

  return updated
}

/**
 * Get today's review queue sorted by urgency.
 * Combines flashcards, exercises, notes, and oral questions.
 */
export async function getTodayReviewQueue(
  topicNames: Map<string, string>,
): Promise<ReviewItem[]> {
  const states = await getAllMemoryStates()
  const now = new Date()
  const items: ReviewItem[] = []

  for (const state of states) {
    if (!state.last_review) continue

    const elapsedMs = now.getTime() - new Date(state.last_review).getTime()
    const elapsedDays = elapsedMs / (24 * 60 * 60 * 1000)
    const retention = calculateRetention(state.stability, elapsedDays)
    const nextReview = state.next_optimal_review ? new Date(state.next_optimal_review) : null
    const isOverdue = nextReview ? now > nextReview : false
    const daysOverdue = nextReview ? Math.max(0, (now.getTime() - nextReview.getTime()) / (24 * 60 * 60 * 1000)) : 0

    if (retention < TARGET_RETENTION || isOverdue) {
      let urgency: ReviewItem['urgency'] = 'low'
      if (retention < 0.3) urgency = 'critical'
      else if (retention < 0.5) urgency = 'high'
      else if (retention < 0.7) urgency = 'medium'

      // Suggest activity based on retention level
      let suggestedActivity = 'Revise flashcards'
      if (retention < 0.3) suggestedActivity = 'Releia a nota e refaça exercícios'
      else if (retention < 0.5) suggestedActivity = 'Faça exercícios práticos'
      else if (retention < 0.7) suggestedActivity = 'Revise flashcards'
      else suggestedActivity = 'Revisão rápida'

      items.push({
        topic_id: state.topic_id,
        topic_name: topicNames.get(state.topic_id) ?? state.topic_id,
        retention_estimate: Math.round(retention * 100) / 100,
        urgency,
        days_overdue: Math.round(daysOverdue * 10) / 10,
        suggested_activity: suggestedActivity,
        source_type: 'topic_review',
      })
    }
  }

  // Sort by urgency: critical > high > medium > low, then by retention (lower first)
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency] || a.retention_estimate - b.retention_estimate)

  return items
}
