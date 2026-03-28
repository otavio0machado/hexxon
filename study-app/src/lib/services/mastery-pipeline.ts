// ============================================================
// Mastery Pipeline — Auto-updates mastery from scores & attempts
// ============================================================

import { supabase, type MasteryLevel } from '../supabase'

/**
 * Score thresholds for mastery levels (0-10 scale)
 */
function scoreToMastery(score: number): MasteryLevel {
  if (score >= 9) return 'mastered'
  if (score >= 7.5) return 'proficient'
  if (score >= 5) return 'developing'
  if (score >= 3) return 'exposed'
  return 'none'
}

/**
 * Success rate thresholds for mastery levels (0-1 scale)
 */
function successRateToMastery(rate: number, attempts: number): MasteryLevel {
  if (attempts < 3) return 'exposed' // Not enough data
  if (rate >= 0.9) return 'mastered'
  if (rate >= 0.75) return 'proficient'
  if (rate >= 0.5) return 'developing'
  if (rate >= 0.2) return 'exposed'
  return 'none'
}

/**
 * Mastery score (0-1) from level name
 */
function masteryToScore(level: MasteryLevel): number {
  const map: Record<MasteryLevel, number> = {
    none: 0,
    exposed: 0.2,
    developing: 0.5,
    proficient: 0.75,
    mastered: 0.95,
  }
  return map[level]
}

/**
 * After an assessment score is saved, recalculate mastery for related topics.
 */
export async function recalculateMasteryFromScore(
  assessmentId: string,
  score: number,
): Promise<{ updated: number; newMastery: MasteryLevel }> {
  const newMastery = scoreToMastery(score)
  const newScore = masteryToScore(newMastery)

  // Get topics linked to this assessment
  const { data: links } = await supabase
    .from('assessment_topics')
    .select('topic_id')
    .eq('assessment_id', assessmentId)

  if (!links || links.length === 0) {
    return { updated: 0, newMastery }
  }

  let updated = 0
  for (const link of links) {
    // Only upgrade mastery, never downgrade from a single score
    const { data: topic } = await supabase
      .from('topics')
      .select('mastery, score')
      .eq('id', link.topic_id)
      .single()

    if (!topic) continue

    const currentScore = topic.score ?? 0
    if (newScore > currentScore) {
      const { error } = await supabase
        .from('topics')
        .update({
          mastery: newMastery,
          score: newScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', link.topic_id)

      if (!error) updated++
    }
  }

  return { updated, newMastery }
}

/**
 * After exercise attempts, recalculate mastery based on success rate.
 */
export async function recalculateMasteryFromAttempts(
  topicId: string,
): Promise<{ newMastery: MasteryLevel; successRate: number }> {
  // Get all attempts for exercises in this topic
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id')
    .eq('topic_id', topicId)

  if (!exercises || exercises.length === 0) {
    return { newMastery: 'none', successRate: 0 }
  }

  const exerciseIds = exercises.map(e => e.id)
  const { data: attempts } = await supabase
    .from('attempts')
    .select('is_correct')
    .in('exercise_id', exerciseIds)

  if (!attempts || attempts.length === 0) {
    return { newMastery: 'none', successRate: 0 }
  }

  const correct = attempts.filter(a => a.is_correct).length
  const successRate = correct / attempts.length
  const newMastery = successRateToMastery(successRate, attempts.length)
  const newScore = masteryToScore(newMastery)

  // Update topic mastery
  await supabase
    .from('topics')
    .update({
      mastery: newMastery,
      score: newScore,
      updated_at: new Date().toISOString(),
    })
    .eq('id', topicId)

  return { newMastery, successRate }
}
