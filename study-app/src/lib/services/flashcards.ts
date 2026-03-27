import { supabase, type Flashcard, type FlashcardType } from '../supabase'

export async function getFlashcards(): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .order('next_review')
  if (error) throw error
  return data ?? []
}

export async function getFlashcardsByDiscipline(disciplineId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('discipline_id', disciplineId)
    .order('next_review')
  if (error) throw error
  return data ?? []
}

export async function getFlashcardsByTopic(topicId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('topic_id', topicId)
    .order('next_review')
  if (error) throw error
  return data ?? []
}

export async function getDueFlashcards(): Promise<Flashcard[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .lte('next_review', today)
    .order('sr_box')
  if (error) throw error
  return data ?? []
}

export async function getDueCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0]
  const { count, error } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .lte('next_review', today)
  if (error) throw error
  return count ?? 0
}

export async function createFlashcard(card: {
  topic_id: string
  discipline_id: string
  front: string
  back: string
  type?: FlashcardType
  difficulty?: number
  tags?: string[]
  ai_generated?: boolean
}): Promise<Flashcard> {
  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      topic_id: card.topic_id,
      discipline_id: card.discipline_id,
      front: card.front,
      back: card.back,
      type: card.type ?? 'definition',
      difficulty: card.difficulty ?? 1,
      tags: card.tags ?? [],
      ai_generated: card.ai_generated ?? false,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateFlashcard(
  id: string,
  updates: Partial<Pick<Flashcard, 'front' | 'back' | 'type' | 'difficulty' | 'tags'>>
): Promise<Flashcard> {
  const { data, error } = await supabase
    .from('flashcards')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFlashcard(id: string): Promise<void> {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Leitner intervals: box → days until next review
const LEITNER_INTERVALS = [1, 2, 5, 14, 30]

export async function reviewFlashcard(
  id: string,
  correct: boolean
): Promise<Flashcard> {
  const { data: card, error: fetchErr } = await supabase
    .from('flashcards')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr

  const newBox = correct
    ? Math.min(card.sr_box + 1, 4)
    : Math.max(card.sr_box - 1, 0)

  const daysUntilNext = LEITNER_INTERVALS[newBox]
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + daysUntilNext)

  const { data, error } = await supabase
    .from('flashcards')
    .update({
      sr_box: newBox,
      next_review: nextReview.toISOString().split('T')[0],
      times_reviewed: card.times_reviewed + 1,
      times_correct: correct ? card.times_correct + 1 : card.times_correct,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export function filterFlashcards(
  cards: Flashcard[],
  filters: { discipline?: string; type?: string; search?: string; dueOnly?: boolean }
): Flashcard[] {
  let result = cards
  if (filters.discipline && filters.discipline !== 'all') {
    result = result.filter(c => c.discipline_id === filters.discipline)
  }
  if (filters.type && filters.type !== 'all') {
    result = result.filter(c => c.type === filters.type)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      c => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
    )
  }
  if (filters.dueOnly) {
    const today = new Date().toISOString().split('T')[0]
    result = result.filter(c => c.next_review <= today)
  }
  return result
}
