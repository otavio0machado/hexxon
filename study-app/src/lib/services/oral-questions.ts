import { supabase, type OralQuestion } from '../supabase'

export async function getOralQuestions(): Promise<OralQuestion[]> {
  const { data, error } = await supabase
    .from('oral_questions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getOralQuestionsByTopic(topicId: string): Promise<OralQuestion[]> {
  const { data, error } = await supabase
    .from('oral_questions')
    .select('*')
    .eq('topic_id', topicId)
    .order('difficulty')
  if (error) throw error
  return data ?? []
}

export async function getOralQuestionsByDiscipline(disciplineId: string): Promise<OralQuestion[]> {
  const { data, error } = await supabase
    .from('oral_questions')
    .select('*')
    .eq('discipline_id', disciplineId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createOralQuestion(q: {
  topic_id: string
  discipline_id: string
  question: string
  expected_points: string[]
  model_answer: string
  difficulty?: OralQuestion['difficulty']
  related_concepts?: string[]
  tags?: string[]
  ai_generated?: boolean
}): Promise<OralQuestion> {
  const { data, error } = await supabase
    .from('oral_questions')
    .insert({
      topic_id: q.topic_id,
      discipline_id: q.discipline_id,
      question: q.question,
      expected_points: q.expected_points,
      model_answer: q.model_answer,
      difficulty: q.difficulty ?? 'medium',
      related_concepts: q.related_concepts ?? [],
      tags: q.tags ?? [],
      ai_generated: q.ai_generated ?? false,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteOralQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('oral_questions')
    .delete()
    .eq('id', id)
  if (error) throw error
}
