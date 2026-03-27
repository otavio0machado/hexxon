import { supabase, type Discipline, type Module, type Topic } from '../supabase'

export async function getDisciplines(): Promise<Discipline[]> {
  const { data, error } = await supabase
    .from('disciplines')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getDiscipline(id: string): Promise<Discipline | null> {
  const { data, error } = await supabase
    .from('disciplines')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getModulesByDiscipline(disciplineId: string): Promise<Module[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('discipline_id', disciplineId)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getTopicsByDiscipline(disciplineId: string): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('discipline_id', disciplineId)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getTopicsByModule(moduleId: string): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function getAllTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('discipline_id, sort_order')
  if (error) throw error
  return data ?? []
}

export async function getTopic(id: string): Promise<Topic | null> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', id)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateTopicMastery(
  topicId: string,
  mastery: Topic['mastery'],
  score: number
): Promise<void> {
  const { error } = await supabase
    .from('topics')
    .update({ mastery, score, updated_at: new Date().toISOString() })
    .eq('id', topicId)
  if (error) throw error
}

export async function incrementTopicExercises(
  topicId: string,
  attempted: number,
  available: number
): Promise<void> {
  const topic = await getTopic(topicId)
  if (!topic) return
  const { error } = await supabase
    .from('topics')
    .update({
      exercises_attempted: topic.exercises_attempted + attempted,
      exercises_available: Math.max(topic.exercises_available, available),
      updated_at: new Date().toISOString(),
    })
    .eq('id', topicId)
  if (error) throw error
}
