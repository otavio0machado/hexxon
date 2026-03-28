'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  Plus,
  Check,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Code,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import type { Task, TaskPriority, Assessment, StudySession } from '@/lib/supabase'

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const priorityStyles: Record<TaskPriority, { label: string; class: string }> = {
  low: { label: 'Baixa', class: 'bg-fg-muted/10 text-fg-muted' },
  medium: { label: 'Média', class: 'bg-accent-warning/10 text-accent-warning' },
  high: { label: 'Alta', class: 'bg-accent-danger/10 text-accent-danger' },
}

interface DayPanelProps {
  date: string // YYYY-MM-DD
  assessments: Assessment[]
  sessions: StudySession[]
  onClose: () => void
  onTasksChanged: () => void
}

export function DayPanel({ date, assessments, sessions, onClose, onTasksChanged }: DayPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  const dateObj = new Date(date + 'T12:00:00')
  const formattedDate = `${WEEKDAYS[dateObj.getDay()]}, ${dateObj.getDate()} de ${MONTHS[dateObj.getMonth()]}`

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?date=${date}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks ?? [])
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleToggleComplete = async (task: Task) => {
    const newVal = !task.is_completed
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: newVal } : t))
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, is_completed: newVal }),
    })
    onTasksChanged()
  }

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    onTasksChanged()
  }

  const handleTaskCreated = (task: Task) => {
    setTasks(prev => [...prev, task])
    setShowNewForm(false)
    onTasksChanged()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md h-full bg-bg-primary border-l border-border-default overflow-y-auto slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border-default bg-bg-primary/95 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-semibold text-fg-primary">{formattedDate}</h2>
            <p className="text-xs text-fg-muted mt-0.5">{date}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-fg-muted hover:bg-bg-secondary hover:text-fg-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* Assessments */}
          {assessments.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Avaliações</h3>
              <div className="space-y-2">
                {assessments.map(a => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border-default bg-bg-surface px-3 py-2">
                    <Badge variant={a.type === 'prova' || a.type === 'g2' ? 'danger' : 'warning'}>
                      {a.type.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-fg-primary flex-1">{a.name}</span>
                    {a.score !== null && (
                      <span className="text-sm font-mono text-fg-secondary">{a.score}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Study Sessions */}
          {sessions.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-muted mb-2">Sessões de Estudo</h3>
              <div className="space-y-2">
                {sessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border-default bg-bg-surface px-3 py-2">
                    <Clock className="h-3.5 w-3.5 text-fg-muted" />
                    <span className="text-sm text-fg-secondary flex-1">{s.kind} — {s.duration_min}min</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tasks */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Tarefas</h3>
              <button
                onClick={() => setShowNewForm(true)}
                className="flex items-center gap-1 text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Nova
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-6"><Spinner size="md" /></div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    expanded={expandedTaskId === task.id}
                    onToggle={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    onToggleComplete={() => handleToggleComplete(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))}
                {tasks.length === 0 && !showNewForm && (
                  <p className="text-sm text-fg-muted text-center py-4">Nenhuma tarefa para este dia</p>
                )}
              </div>
            )}

            {showNewForm && (
              <NewTaskForm
                date={date}
                onCreated={handleTaskCreated}
                onCancel={() => setShowNewForm(false)}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function TaskItem({
  task,
  expanded,
  onToggle,
  onToggleComplete,
  onDelete,
}: {
  task: Task
  expanded: boolean
  onToggle: () => void
  onToggleComplete: () => void
  onDelete: () => void
}) {
  const prio = priorityStyles[task.priority]

  return (
    <div className={cn(
      'rounded-lg border bg-bg-surface transition-colors',
      task.is_completed ? 'border-border-default/50 opacity-60' : 'border-border-default',
    )}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={onToggleComplete}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
            task.is_completed
              ? 'bg-accent-success border-accent-success text-white'
              : 'border-border-default hover:border-accent-primary',
          )}
        >
          {task.is_completed && <Check className="h-3 w-3" />}
        </button>

        <button onClick={onToggle} className="flex-1 text-left min-w-0">
          <span className={cn('text-sm', task.is_completed ? 'line-through text-fg-muted' : 'text-fg-primary')}>
            {task.title}
          </span>
        </button>

        {task.start_time && (
          <span className="text-[10px] text-fg-muted font-mono shrink-0">{task.start_time}</span>
        )}
        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0', prio.class)}>
          {prio.label}
        </span>
        {expanded ? <ChevronUp className="h-3 w-3 text-fg-muted shrink-0" /> : <ChevronDown className="h-3 w-3 text-fg-muted shrink-0" />}
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border-default/50 space-y-2">
          {task.description && (
            <p className="text-xs text-fg-secondary whitespace-pre-wrap">{task.description}</p>
          )}
          {task.start_time && task.end_time && (
            <p className="text-xs text-fg-muted flex items-center gap-1">
              <Clock className="h-3 w-3" /> {task.start_time} — {task.end_time}
            </p>
          )}
          {task.attachments?.length > 0 && (
            <div className="space-y-1">
              {task.attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-fg-muted">
                  {att.type === 'image' && <ImageIcon className="h-3 w-3" />}
                  {att.type === 'code' && <Code className="h-3 w-3" />}
                  <span>{att.label ?? att.type}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-xs text-accent-danger hover:text-accent-danger/80 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NewTaskForm({
  date,
  onCreated,
  onCancel,
}: {
  date: string
  onCreated: (task: Task) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [saving, setSaving] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [codeBlock, setCodeBlock] = useState('')

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSaving(true)

    const fullDescription = codeBlock
      ? `${description}\n\n\`\`\`\n${codeBlock}\n\`\`\``
      : description

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          date,
          description: fullDescription || undefined,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
          priority,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        onCreated(data.task)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-accent-primary/30 bg-accent-primary/5 p-3 space-y-3 mt-2">
      <Input
        placeholder="Título da tarefa..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !showDetails) handleSubmit() }}
        autoFocus
      />

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg-secondary transition-colors"
      >
        {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {showDetails ? 'Menos detalhes' : 'Mais detalhes'}
      </button>

      {showDetails && (
        <>
          <Textarea
            placeholder="Descrição (suporta markdown)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-fg-muted block mb-1">Início</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-fg-muted block mb-1">Fim</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-fg-muted block mb-1">Prioridade</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </Select>
          </div>

          <div>
            <button
              onClick={() => setCodeBlock(codeBlock ? '' : ' ')}
              className="flex items-center gap-1 text-xs text-fg-muted hover:text-fg-secondary transition-colors"
            >
              <Code className="h-3 w-3" />
              {codeBlock ? 'Remover bloco de código' : 'Adicionar bloco de código'}
            </button>
            {codeBlock && (
              <Textarea
                placeholder="Cole seu código aqui..."
                value={codeBlock}
                onChange={(e) => setCodeBlock(e.target.value)}
                rows={4}
                className="mt-2 font-mono text-xs"
              />
            )}
          </div>
        </>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button size="sm" loading={saving} onClick={handleSubmit} disabled={!title.trim()} className="flex-1">
          Criar tarefa
        </Button>
      </div>
    </div>
  )
}
