// ============================================================
// Document Text Extraction
// Handles PDF, DOCX, PPTX, and image files
// ============================================================

import type { DocumentChunk } from './types'

/**
 * Extract text from a PDF buffer using pdf-parse
 */
export async function extractPdfText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  // Dynamic import to avoid bundling issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>
  const result = await pdfParse(buffer)
  return {
    text: result.text,
    pageCount: result.numpages,
  }
}

/**
 * Estimate token count (rough: ~4 chars per token for Portuguese)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

/**
 * Chunk text into smaller pieces for search and context injection.
 * Uses a simple paragraph-based splitting strategy.
 */
export function chunkText(
  text: string,
  options: { maxTokens?: number; overlap?: number } = {}
): Omit<DocumentChunk, 'id' | 'document_id' | 'user_id' | 'created_at'>[] {
  const { maxTokens = 500, overlap = 50 } = options
  const maxChars = maxTokens * 4 // rough estimate
  const overlapChars = overlap * 4

  // Split by double newlines (paragraphs) first
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 20)
  const chunks: Omit<DocumentChunk, 'id' | 'document_id' | 'user_id' | 'created_at'>[] = []

  let currentChunk = ''
  let chunkIndex = 0

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChars && currentChunk.length > 0) {
      chunks.push({
        chunk_index: chunkIndex,
        content: currentChunk.trim(),
        token_count: estimateTokens(currentChunk),
        page_number: null,
        section_title: null,
        chunk_type: detectChunkType(currentChunk),
      })
      chunkIndex++
      // Keep overlap from end of previous chunk
      currentChunk = currentChunk.slice(-overlapChars) + '\n\n' + paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }

  // Push remaining
  if (currentChunk.trim().length > 20) {
    chunks.push({
      chunk_index: chunkIndex,
      content: currentChunk.trim(),
      token_count: estimateTokens(currentChunk),
      page_number: null,
      section_title: null,
      chunk_type: detectChunkType(currentChunk),
    })
  }

  return chunks
}

/**
 * Simple heuristic to detect chunk type
 */
function detectChunkType(text: string): 'text' | 'exercise' | 'definition' | 'theorem' | 'example' {
  const lower = text.toLowerCase()
  if (/^(exerc[ií]cio|quest[aã]o|problema)\s*\d/im.test(text)) return 'exercise'
  if (/^(defini[çc][aã]o|def\.)\s/im.test(text)) return 'definition'
  if (/^(teorema|teo\.)\s/im.test(text)) return 'theorem'
  if (/^(exemplo|ex\.)\s*\d/im.test(text)) return 'example'
  if (lower.includes('resolução') || lower.includes('solução')) return 'example'
  return 'text'
}
