import { supabase, type StudySession, type SessionKind } from '../supabase'

export async function getStudySessions(limit = 50): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getStudySessionsByDiscipline(
  disciplineId: string,
  limit = 50
): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('discipline_id', disciplineId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getRecentSessions(days = 7): Promise<StudySession[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getTodaySessions(): Promise<StudySession[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createStudySession(session: {
  topic_id?: string
  discipline_id?: string
  kind: SessionKind
  duration_min: number
  exercises_attempted?: number
  exercises_correct?: number
  notes?: string
}): Promise<StudySession> {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      topic_id: session.topic_id ?? null,
      discipline_id: session.discipline_id ?? null,
      kind: session.kind,
      duration_min: session.duration_min,
      exercises_attempted: session.exercises_attempted ?? 0,
      exercises_correct: session.exercises_correct ?? 0,
      notes: session.notes ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateStudySession(
  id: string,
  updates: Partial<Pick<StudySession, 'duration_min' | 'exercises_attempted' | 'exercises_correct' | 'notes'>>
): Promise<StudySession> {
  const { data, error } = await supabase
    .from('study_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteStudySession(id: string): Promise<void> {
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export function getTotalStudyMinutes(sessions: StudySession[]): number {
  return sessions.reduce((sum, s) => sum + s.duration_min, 0)
}

export function getStudyStreak(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0
  const days = new Set(
    sessions.map(s => new Date(s.created_at).toISOString().split('T')[0])
  )
  const sorted = [...days].sort().reverse()
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (days.has(key)) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}
