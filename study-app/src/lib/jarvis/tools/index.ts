// ============================================================
// JARVIS — Tool Registry
// All tools that Jarvis can execute on the system
// ============================================================

import type { ToolDefinition, ToolResult, ProviderTool } from '../types'
import type { NoteFormat, ContentStatus, MasteryLevel, FlashcardType, ExerciseType, ErrorCategory, ErrorSeverity, SessionKind } from '@/lib/supabase'
import { createNote, updateNote, deleteNote, getNotes, getNotesByTopic, getNotesByDiscipline } from '@/lib/services/notes'
import { createFlashcard, deleteFlashcard, getFlashcards, getFlashcardsByTopic, getDueFlashcards, reviewFlashcard } from '@/lib/services/flashcards'
import { createStudySession, getStudySessions } from '@/lib/services/study-sessions'
import { createExercise, getExercises, getExercisesByTopic, createAttempt, createErrorOccurrence } from '@/lib/services/exercises'
import { getAssessments } from '@/lib/services/assessments'
import { getAllTopics, getDisciplines, updateTopicMastery } from '@/lib/services/disciplines'

// ── Helper ──────────────────────────────────────────────────

function makeResult(toolCallId: string, success: boolean, message: string, data?: unknown): ToolResult {
  return { toolCallId, success, message, data }
}

// ── Tool Definitions ────────────────────────────────────────

const tools: ToolDefinition[] = [
  // ── NOTES ─────────────────────────────────────────────────
  {
    name: 'createNote',
    description: 'Create a new study note for a topic. Returns the created note.',
    category: 'notes',
    parameters: {
      title: { type: 'string', description: 'Title of the note' },
      content: { type: 'string', description: 'Markdown content of the note' },
      topic_id: { type: 'string', description: 'ID of the topic this note belongs to' },
      discipline_id: { type: 'string', description: 'ID of the discipline' },
      format: { type: 'string', description: 'Note format', enum: ['cornell', 'outline', 'concept_map', 'summary', 'free'] },
      key_concepts: { type: 'array', description: 'Key concepts covered in this note' },
      tags: { type: 'array', description: 'Tags for this note' },
    },
    required: ['title', 'content', 'topic_id', 'discipline_id'],
    execute: async (params) => {
      try {
        const note = await createNote({
          title: params.title as string,
          content: params.content as string,
          topic_id: params.topic_id as string,
          discipline_id: params.discipline_id as string,
          format: ((params.format as string) || 'free') as NoteFormat,
          key_concepts: (params.key_concepts as string[]) || [],
          tags: (params.tags as string[]) || [],
          ai_generated: true,
        })
        return makeResult('', true, `Nota "${note.title}" criada com sucesso.`, note)
      } catch (e) {
        return makeResult('', false, `Erro ao criar nota: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'updateNote',
    description: 'Update an existing note by ID.',
    category: 'notes',
    parameters: {
      id: { type: 'string', description: 'ID of the note to update' },
      title: { type: 'string', description: 'New title (optional)' },
      content: { type: 'string', description: 'New content (optional)' },
      status: { type: 'string', description: 'New status', enum: ['draft', 'review', 'done'] },
    },
    required: ['id'],
    execute: async (params) => {
      try {
        const updates: Record<string, unknown> = {}
        if (params.title) updates.title = params.title
        if (params.content) updates.content = params.content
        if (params.status) updates.status = params.status
        const note = await updateNote(params.id as string, updates)
        return makeResult('', true, `Nota "${note.title}" atualizada.`, note)
      } catch (e) {
        return makeResult('', false, `Erro ao atualizar nota: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'deleteNote',
    description: 'Delete a note by ID.',
    category: 'notes',
    parameters: {
      id: { type: 'string', description: 'ID of the note to delete' },
    },
    required: ['id'],
    execute: async (params) => {
      try {
        await deleteNote(params.id as string)
        return makeResult('', true, 'Nota excluída com sucesso.')
      } catch (e) {
        return makeResult('', false, `Erro ao excluir nota: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listNotes',
    description: 'List all study notes. Optionally filter by topic or discipline.',
    category: 'notes',
    parameters: {
      topic_id: { type: 'string', description: 'Filter by topic ID (optional)' },
      discipline_id: { type: 'string', description: 'Filter by discipline ID (optional)' },
    },
    required: [],
    execute: async (params) => {
      try {
        const notes = params.topic_id
          ? await getNotesByTopic(params.topic_id as string)
          : params.discipline_id
            ? await getNotesByDiscipline(params.discipline_id as string)
            : await getNotes()
        return makeResult('', true, `Encontradas ${notes.length} notas.`, notes.map(n => ({ id: n.id, title: n.title, format: n.format, status: n.status, topic_id: n.topic_id })))
      } catch (e) {
        return makeResult('', false, `Erro ao listar notas: ${(e as Error).message}`)
      }
    },
  },

  // ── FLASHCARDS ────────────────────────────────────────────
  {
    name: 'createFlashcards',
    description: 'Create one or more flashcards for a topic. Provide an array of cards with front and back.',
    category: 'flashcards',
    parameters: {
      topic_id: { type: 'string', description: 'Topic ID' },
      discipline_id: { type: 'string', description: 'Discipline ID' },
      cards: { type: 'array', description: 'Array of {front, back, type, difficulty} objects' },
    },
    required: ['topic_id', 'discipline_id', 'cards'],
    execute: async (params) => {
      try {
        const cards = params.cards as Array<{ front: string; back: string; type?: string; difficulty?: number }>
        const results = []
        for (const card of cards) {
          const fc = await createFlashcard({
            topic_id: params.topic_id as string,
            discipline_id: params.discipline_id as string,
            front: card.front,
            back: card.back,
            type: (card.type as 'definition' | 'theorem' | 'procedure' | 'example') || 'definition',
            difficulty: card.difficulty ?? 3,
            ai_generated: true,
          })
          results.push(fc)
        }
        return makeResult('', true, `${results.length} flashcard(s) criado(s) com sucesso.`, results.map(f => ({ id: f.id, front: f.front })))
      } catch (e) {
        return makeResult('', false, `Erro ao criar flashcards: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'deleteFlashcard',
    description: 'Delete a flashcard by ID.',
    category: 'flashcards',
    parameters: {
      id: { type: 'string', description: 'ID of the flashcard to delete' },
    },
    required: ['id'],
    execute: async (params) => {
      try {
        await deleteFlashcard(params.id as string)
        return makeResult('', true, 'Flashcard excluído.')
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listFlashcards',
    description: 'List flashcards, optionally filtered by topic.',
    category: 'flashcards',
    parameters: {
      topic_id: { type: 'string', description: 'Filter by topic ID (optional)' },
    },
    required: [],
    execute: async (params) => {
      try {
        const fcs = params.topic_id
          ? await getFlashcardsByTopic(params.topic_id as string)
          : await getFlashcards()
        return makeResult('', true, `${fcs.length} flashcards encontrados.`, fcs.map(f => ({ id: f.id, front: f.front, back: f.back, sr_box: f.sr_box, next_review: f.next_review })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listDueFlashcards',
    description: 'List flashcards that are due for review today.',
    category: 'flashcards',
    parameters: {},
    required: [],
    execute: async () => {
      try {
        const fcs = await getDueFlashcards()
        return makeResult('', true, `${fcs.length} flashcards para revisar hoje.`, fcs.map(f => ({ id: f.id, front: f.front, back: f.back, sr_box: f.sr_box })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'reviewFlashcard',
    description: 'Mark a flashcard as reviewed (correct or incorrect). Updates spaced repetition.',
    category: 'flashcards',
    parameters: {
      id: { type: 'string', description: 'Flashcard ID' },
      correct: { type: 'boolean', description: 'Whether the answer was correct' },
    },
    required: ['id', 'correct'],
    execute: async (params) => {
      try {
        const fc = await reviewFlashcard(params.id as string, params.correct as boolean)
        return makeResult('', true, `Flashcard revisado. Box: ${fc.sr_box}, próxima revisão: ${fc.next_review}`, fc)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── STUDY SESSIONS ────────────────────────────────────────
  {
    name: 'createStudySession',
    description: 'Create a new study session with duration, kind, and optional notes.',
    category: 'sessions',
    parameters: {
      topic_id: { type: 'string', description: 'Topic studied (optional)' },
      discipline_id: { type: 'string', description: 'Discipline (optional)' },
      kind: { type: 'string', description: 'Session type', enum: ['study', 'exercise', 'review', 'simulation', 'flashcard'] },
      duration_min: { type: 'number', description: 'Duration in minutes' },
      notes: { type: 'string', description: 'Session notes (optional)' },
    },
    required: ['kind', 'duration_min'],
    execute: async (params) => {
      try {
        const session = await createStudySession({
          topic_id: params.topic_id as string | undefined,
          discipline_id: params.discipline_id as string | undefined,
          kind: params.kind as SessionKind,
          duration_min: params.duration_min as number,
          notes: params.notes as string | undefined,
        })
        return makeResult('', true, `Sessão de ${params.duration_min}min registrada.`, session)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listStudySessions',
    description: 'List recent study sessions.',
    category: 'sessions',
    parameters: {
      limit: { type: 'number', description: 'Max number of sessions to return (default 20)' },
    },
    required: [],
    execute: async (params) => {
      try {
        const sessions = await getStudySessions(params.limit as number ?? 20)
        return makeResult('', true, `${sessions.length} sessões encontradas.`, sessions.map(s => ({ id: s.id, kind: s.kind, duration_min: s.duration_min, created_at: s.created_at, notes: s.notes })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── EXERCISES ─────────────────────────────────────────────
  {
    name: 'createExercise',
    description: 'Create a new exercise for a topic.',
    category: 'exercises',
    parameters: {
      topic_id: { type: 'string', description: 'Topic ID' },
      discipline_id: { type: 'string', description: 'Discipline ID' },
      statement: { type: 'string', description: 'Exercise statement/question' },
      type: { type: 'string', description: 'Type', enum: ['multiple_choice', 'open_ended', 'proof', 'computation'] },
      difficulty: { type: 'number', description: 'Difficulty 1-5' },
      solution: { type: 'string', description: 'Full solution' },
      hints: { type: 'array', description: 'Progressive hints' },
      concepts_tested: { type: 'array', description: 'Concepts tested' },
    },
    required: ['topic_id', 'discipline_id', 'statement', 'type', 'difficulty', 'solution'],
    execute: async (params) => {
      try {
        const ex = await createExercise({
          topic_id: params.topic_id as string,
          discipline_id: params.discipline_id as string,
          statement: params.statement as string,
          type: params.type as ExerciseType,
          difficulty: params.difficulty as number,
          solution: params.solution as string,
          hints: (params.hints as string[]) || [],
          concepts_tested: (params.concepts_tested as string[]) || [],
          ai_generated: true,
        })
        return makeResult('', true, `Exercício criado com sucesso.`, ex)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listExercises',
    description: 'List exercises, optionally by topic.',
    category: 'exercises',
    parameters: {
      topic_id: { type: 'string', description: 'Filter by topic (optional)' },
    },
    required: [],
    execute: async (params) => {
      try {
        const exs = params.topic_id
          ? await getExercisesByTopic(params.topic_id as string)
          : await getExercises()
        return makeResult('', true, `${exs.length} exercícios encontrados.`, exs.map(e => ({ id: e.id, statement: e.statement.slice(0, 100), type: e.type, difficulty: e.difficulty })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'submitAttempt',
    description: 'Submit an answer to an exercise and record the attempt.',
    category: 'exercises',
    parameters: {
      exercise_id: { type: 'string', description: 'Exercise ID' },
      topic_id: { type: 'string', description: 'Topic ID' },
      student_answer: { type: 'string', description: 'Student answer' },
      is_correct: { type: 'boolean', description: 'Whether answer is correct' },
      time_spent_sec: { type: 'number', description: 'Time spent in seconds' },
    },
    required: ['exercise_id', 'topic_id', 'student_answer', 'is_correct'],
    execute: async (params) => {
      try {
        const attempt = await createAttempt({
          exercise_id: params.exercise_id as string,
          topic_id: params.topic_id as string,
          student_answer: params.student_answer as string,
          is_correct: params.is_correct as boolean,
          time_spent_sec: params.time_spent_sec as number | undefined,
        })
        return makeResult('', true, params.is_correct ? 'Resposta correta registrada!' : 'Resposta incorreta registrada.', attempt)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── ERROR CLASSIFICATION ──────────────────────────────────
  {
    name: 'classifyError',
    description: 'Classify and record a student error occurrence.',
    category: 'errors',
    parameters: {
      topic_id: { type: 'string', description: 'Topic ID' },
      discipline_id: { type: 'string', description: 'Discipline ID' },
      category: { type: 'string', description: 'Error category', enum: ['conceptual', 'algebraic', 'logical', 'interpretation', 'formalization'] },
      severity: { type: 'string', description: 'Severity', enum: ['critical', 'high', 'medium', 'low'] },
      exercise_statement: { type: 'string', description: 'The exercise that was attempted' },
      student_answer: { type: 'string', description: 'What the student answered' },
      correct_answer: { type: 'string', description: 'The correct answer' },
      ai_explanation: { type: 'string', description: 'AI explanation of the error' },
      root_cause: { type: 'string', description: 'Root cause analysis' },
      remediation: { type: 'string', description: 'Suggested remediation' },
    },
    required: ['topic_id', 'discipline_id', 'category', 'severity', 'exercise_statement', 'student_answer', 'correct_answer'],
    execute: async (params) => {
      try {
        const err = await createErrorOccurrence({
          topic_id: params.topic_id as string,
          discipline_id: params.discipline_id as string,
          category: params.category as ErrorCategory,
          severity: params.severity as ErrorSeverity,
          exercise_statement: params.exercise_statement as string,
          student_answer: params.student_answer as string,
          correct_answer: params.correct_answer as string,
          ai_explanation: params.ai_explanation as string | undefined,
          root_cause: params.root_cause as string | undefined,
          remediation: params.remediation as string | undefined,
        })
        return makeResult('', true, `Erro classificado como ${params.category} (${params.severity}).`, err)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── PROGRESS ──────────────────────────────────────────────
  {
    name: 'updateMastery',
    description: 'Update mastery level and score for a topic.',
    category: 'progress',
    parameters: {
      topic_id: { type: 'string', description: 'Topic ID' },
      mastery: { type: 'string', description: 'Mastery level', enum: ['none', 'exposed', 'developing', 'proficient', 'mastered'] },
      score: { type: 'number', description: 'Score 0-1' },
    },
    required: ['topic_id', 'mastery'],
    execute: async (params) => {
      try {
        await updateTopicMastery(
          params.topic_id as string,
          params.mastery as MasteryLevel,
          (params.score as number) ?? 0,
        )
        return makeResult('', true, `Mastery atualizado para ${params.mastery}.`)
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── DATA QUERIES ──────────────────────────────────────────
  {
    name: 'listDisciplines',
    description: 'List all disciplines/courses.',
    category: 'progress',
    parameters: {},
    required: [],
    execute: async () => {
      try {
        const discs = await getDisciplines()
        return makeResult('', true, `${discs.length} disciplinas.`, discs.map(d => ({ id: d.id, name: d.name, code: d.code })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listTopics',
    description: 'List all topics, optionally filtered by discipline.',
    category: 'progress',
    parameters: {
      discipline_id: { type: 'string', description: 'Filter by discipline (optional)' },
    },
    required: [],
    execute: async (params) => {
      try {
        const topics = await getAllTopics()
        const filtered = params.discipline_id
          ? topics.filter(t => t.discipline_id === params.discipline_id)
          : topics
        return makeResult('', true, `${filtered.length} tópicos.`, filtered.map(t => ({ id: t.id, name: t.name, mastery: t.mastery, score: t.score, discipline_id: t.discipline_id })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },
  {
    name: 'listAssessments',
    description: 'List all assessments/exams.',
    category: 'exams',
    parameters: {},
    required: [],
    execute: async () => {
      try {
        const assessments = await getAssessments()
        return makeResult('', true, `${assessments.length} avaliações.`, assessments.map(a => ({ id: a.id, name: a.name, date: a.date, type: a.type, status: a.status, score: a.score })))
      } catch (e) {
        return makeResult('', false, `Erro: ${(e as Error).message}`)
      }
    },
  },

  // ── SVG GENERATION ────────────────────────────────────────
  {
    name: 'generateDiagram',
    description: 'Generate an SVG diagram, concept map, or mathematical graph. Returns SVG markup.',
    category: 'visual',
    parameters: {
      type: { type: 'string', description: 'Type of diagram', enum: ['concept_map', 'flowchart', 'graph', 'timeline', 'comparison'] },
      title: { type: 'string', description: 'Title of the diagram' },
      elements: { type: 'array', description: 'Array of {label, connections[]} for concept maps, or {x, y, label} for graphs' },
      description: { type: 'string', description: 'Description for the AI to generate from' },
    },
    required: ['type', 'title'],
    execute: async (params) => {
      // This returns a structured description — the AI will generate actual SVG in its response
      return makeResult('', true, `Diagrama "${params.title}" preparado. O SVG será gerado na resposta.`, {
        type: params.type,
        title: params.title,
        elements: params.elements,
        description: params.description,
        instruction: 'Generate SVG markup inline in your response for this diagram.',
      })
    },
  },
]

// ── Registry ────────────────────────────────────────────────

const toolMap = new Map<string, ToolDefinition>()
for (const tool of tools) {
  toolMap.set(tool.name, tool)
}

export function getTool(name: string): ToolDefinition | undefined {
  return toolMap.get(name)
}

export function getAllTools(): ToolDefinition[] {
  return tools
}

export function getToolsByCategory(category: string): ToolDefinition[] {
  return tools.filter(t => t.category === category)
}

/** Convert tool definitions to provider format */
export function toProviderTools(): ProviderTool[] {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: 'object' as const,
      properties: Object.fromEntries(
        Object.entries(t.parameters).map(([key, param]) => [
          key,
          {
            type: param.type,
            description: param.description,
            ...(param.enum ? { enum: param.enum } : {}),
          },
        ])
      ),
      required: t.required,
    },
  }))
}

/** Execute a tool call */
export async function executeTool(name: string, args: Record<string, unknown>, toolCallId: string): Promise<ToolResult> {
  const tool = toolMap.get(name)
  if (!tool) {
    return { toolCallId, success: false, message: `Tool "${name}" não encontrada.`, error: 'unknown_tool' }
  }
  const result = await tool.execute(args)
  result.toolCallId = toolCallId
  return result
}
