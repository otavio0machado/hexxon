// ============================================================
// Document Search — Keyword-based search in document chunks
// Provides relevant document context for HexxonAI conversations
// ============================================================

import { supabase } from '@/lib/supabase'

export interface DocumentSearchResult {
  chunkContent: string
  documentName: string
  docType: string
  sectionTitle: string | null
  chunkType: string
  relevanceScore: number
}

/**
 * Search document chunks for relevant content using keyword matching.
 * Returns top-k most relevant chunks sorted by relevance.
 *
 * Future: Replace with vector/embedding search for semantic matching.
 */
export async function searchDocumentChunks(
  query: string,
  options: {
    userId?: string
    disciplineId?: string
    maxResults?: number
  } = {}
): Promise<DocumentSearchResult[]> {
  const { disciplineId, maxResults = 5 } = options

  // Extract keywords from query (remove common Portuguese stop words)
  const stopWords = new Set([
    'a', 'o', 'e', 'de', 'do', 'da', 'em', 'um', 'uma', 'para', 'com',
    'que', 'se', 'por', 'no', 'na', 'os', 'as', 'dos', 'das', 'ao', 'aos',
    'sobre', 'como', 'mais', 'ou', 'ser', 'ter', 'foi', 'são', 'está',
    'eu', 'me', 'meu', 'minha', 'isso', 'esse', 'este', 'aquele',
    'não', 'sim', 'bem', 'muito', 'também', 'mas', 'já', 'ainda',
  ])

  const keywords = query
    .toLowerCase()
    .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))

  if (keywords.length === 0) return []

  // Build text search query
  const tsQuery = keywords.join(' & ')

  try {
    // First try: full-text search using PostgreSQL
    let query_builder = supabase
      .from('document_chunks')
      .select(`
        content,
        section_title,
        chunk_type,
        user_documents!inner(file_name, doc_type, discipline_id)
      `)
      .textSearch('content', tsQuery, { type: 'websearch', config: 'portuguese' })
      .limit(maxResults * 2) // Get more, then rank

    if (disciplineId) {
      query_builder = query_builder.eq('user_documents.discipline_id', disciplineId)
    }

    const { data: tsResults } = await query_builder

    if (tsResults && tsResults.length > 0) {
      return tsResults.slice(0, maxResults).map((r) => {
        const doc = r.user_documents as unknown as { file_name: string; doc_type: string }
        return {
          chunkContent: r.content.slice(0, 1000), // Limit context size
          documentName: doc.file_name,
          docType: doc.doc_type,
          sectionTitle: r.section_title,
          chunkType: r.chunk_type,
          relevanceScore: 1.0,
        }
      })
    }

    // Fallback: simple ILIKE search on keywords
    const likePattern = `%${keywords[0]}%`

    let fallbackQuery = supabase
      .from('document_chunks')
      .select(`
        content,
        section_title,
        chunk_type,
        user_documents!inner(file_name, doc_type, discipline_id)
      `)
      .ilike('content', likePattern)
      .limit(maxResults)

    if (disciplineId) {
      fallbackQuery = fallbackQuery.eq('user_documents.discipline_id', disciplineId)
    }

    const { data: fallbackResults } = await fallbackQuery

    if (!fallbackResults) return []

    return fallbackResults.map((r) => {
      const doc = r.user_documents as unknown as { file_name: string; doc_type: string }
      // Score based on how many keywords appear
      const content = r.content.toLowerCase()
      const matchCount = keywords.filter((kw) => content.includes(kw)).length
      return {
        chunkContent: r.content.slice(0, 1000),
        documentName: doc.file_name,
        docType: doc.doc_type,
        sectionTitle: r.section_title,
        chunkType: r.chunk_type,
        relevanceScore: matchCount / keywords.length,
      }
    }).sort((a, b) => b.relevanceScore - a.relevanceScore)
  } catch (error) {
    console.error('Document search error:', error)
    return []
  }
}

/**
 * Get a summary of all user documents for context building.
 */
export async function getUserDocumentsSummary(): Promise<string> {
  const { data: docs } = await supabase
    .from('user_documents')
    .select('file_name, doc_type, discipline_id, processing_status, word_count, ai_analysis')
    .eq('processing_status', 'indexed')

  if (!docs || docs.length === 0) return ''

  const lines = docs.map((d) => {
    const analysis = d.ai_analysis as { summary?: string } | null
    return `  - ${d.file_name} (${d.doc_type})${analysis?.summary ? `: ${analysis.summary}` : ''}`
  })

  return `\nDOCUMENTOS DO ALUNO (${docs.length} indexados):\n${lines.join('\n')}`
}
