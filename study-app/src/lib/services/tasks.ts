import { supabase, type Task, type TaskPriority, type TaskAttachment } from '../supabase'

export async function getTasks(limit = 100): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('date')
    .order('start_time', { nullsFirst: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(normalizeTask)
}

export async function getTasksByDate(date: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('date', date)
    .order('start_time', { nullsFirst: false })
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(normalizeTask)
}

export async function getTasksByRange(startDate: string, endDate: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('start_time', { nullsFirst: false })
  if (error) throw error
  return (data ?? []).map(normalizeTask)
}

export async function createTask(params: {
  title: string
  date: string
  description?: string
  start_time?: string
  end_time?: string
  priority?: TaskPriority
  discipline_id?: string
  attachments?: TaskAttachment[]
}): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: params.title,
      date: params.date,
      description: params.description ?? null,
      start_time: params.start_time ?? null,
      end_time: params.end_time ?? null,
      is_completed: false,
      priority: params.priority ?? 'medium',
      discipline_id: params.discipline_id ?? null,
      attachments: params.attachments ?? [],
    })
    .select()
    .single()
  if (error) throw error
  return normalizeTask(data)
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'created_at'>>,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return normalizeTask(data)
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function toggleTaskComplete(id: string, isCompleted: boolean): Promise<Task> {
  return updateTask(id, { is_completed: isCompleted })
}

function normalizeTask(row: Record<string, unknown>): Task {
  return {
    ...row,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
  } as Task
}
