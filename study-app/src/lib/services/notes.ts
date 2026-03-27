import { supabase, type Note, type NoteFormat, type ContentStatus } from '../supabase'

export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getNotesByDiscipline(disciplineId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('discipline_id', disciplineId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getNotesByTopic(topicId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('topic_id', topicId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getNote(id: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function createNote(note: {
  topic_id: string
  discipline_id: string
  title: string
  content: string
  format?: NoteFormat
  status?: ContentStatus
  key_concepts?: string[]
  linked_topics?: string[]
  tags?: string[]
  ai_generated?: boolean
}): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      topic_id: note.topic_id,
      discipline_id: note.discipline_id,
      title: note.title,
      content: note.content,
      format: note.format ?? 'free',
      status: note.status ?? 'draft',
      key_concepts: note.key_concepts ?? [],
      linked_topics: note.linked_topics ?? [],
      tags: note.tags ?? [],
      ai_generated: note.ai_generated ?? false,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, 'title' | 'content' | 'format' | 'status' | 'key_concepts' | 'linked_topics' | 'tags'>>
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export function filterNotes(
  notes: Note[],
  filters: { discipline?: string; format?: string; status?: string; search?: string }
): Note[] {
  let result = notes
  if (filters.discipline && filters.discipline !== 'all') {
    result = result.filter(n => n.discipline_id === filters.discipline)
  }
  if (filters.format && filters.format !== 'all') {
    result = result.filter(n => n.format === filters.format)
  }
  if (filters.status && filters.status !== 'all') {
    result = result.filter(n => n.status === filters.status)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    )
  }
  return result
}
