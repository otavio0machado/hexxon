// ============================================================
// Document System Types
// ============================================================

export type DocType =
  | 'syllabus'         // Plano de ensino / ementa
  | 'exercise_list'    // Lista de exercícios
  | 'slides'           // Slides de aula
  | 'textbook'         // Livro-texto
  | 'past_exam'        // Prova anterior
  | 'lecture_notes'    // Notas de aula
  | 'solution_key'     // Gabarito / resolução
  | 'other'

export type ProcessingStatus =
  | 'pending'
  | 'extracting'
  | 'analyzing'
  | 'indexed'
  | 'failed'

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  syllabus: 'Plano de Ensino',
  exercise_list: 'Lista de Exercícios',
  slides: 'Slides',
  textbook: 'Livro-texto',
  past_exam: 'Prova Anterior',
  lecture_notes: 'Notas de Aula',
  solution_key: 'Gabarito',
  other: 'Outro',
}

export interface UserDocument {
  id: string
  user_id: string
  discipline_id: string | null
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  doc_type: DocType
  doc_type_confidence: number | null
  processing_status: ProcessingStatus
  extracted_text: string | null
  ai_analysis: DocumentAnalysis | null
  page_count: number | null
  word_count: number | null
  uploaded_at: string
  processed_at: string | null
  source: 'onboarding' | 'materiais_page' | 'hexxon-ai'
  replaces_document_id: string | null
  version: number
}

export interface DocumentAnalysis {
  doc_type: DocType
  confidence: number
  topics: ExtractedTopic[]
  key_concepts: string[]
  exercises: ExtractedExercise[]
  dates: ExtractedDate[]
  summary: string
  assessment_info?: {
    type: string
    weight?: string
    topics_covered: string[]
  }
}

export interface ExtractedTopic {
  name: string
  module_hint?: string
  difficulty_estimate?: number // 1-5
}

export interface ExtractedExercise {
  statement: string
  topic_hint?: string
  difficulty?: number
}

export interface ExtractedDate {
  label: string
  date: string // ISO date
  type: 'exam' | 'assignment' | 'deadline' | 'other'
}

export interface DocumentChunk {
  id: string
  document_id: string
  user_id: string
  chunk_index: number
  content: string
  token_count: number | null
  page_number: number | null
  section_title: string | null
  chunk_type: 'text' | 'exercise' | 'definition' | 'theorem' | 'example'
}

// Bootstrap types
export interface BootstrapInput {
  userId: string
  university: string
  course: string
  currentSemester: number
  totalSemesters: number
  enrollmentYear: string
  documents: Array<{
    id: string
    fileName: string
    docType: DocType
    disciplineId: string | null
    analysis: DocumentAnalysis | null
    extractedText: string | null
  }>
}

export interface BootstrapResult {
  disciplines: BootstrapDiscipline[]
  flashcardsGenerated: number
  kgNodesCreated: number
  kgEdgesCreated: number
}

export interface BootstrapDiscipline {
  id: string
  name: string
  professor?: string
  modules: BootstrapModule[]
  assessments: BootstrapAssessment[]
}

export interface BootstrapModule {
  name: string
  order: number
  topics: BootstrapTopic[]
}

export interface BootstrapTopic {
  name: string
  difficulty: number
  prerequisites: string[]
}

export interface BootstrapAssessment {
  name: string
  type: string
  date?: string
  weight?: number
  topics: string[]
}
