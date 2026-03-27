import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractPdfText, chunkText, countWords } from '@/lib/documents/extract'
import { analyzeDocument } from '@/lib/documents/analyze'

export const runtime = 'nodejs'
export const maxDuration = 60 // Vercel Pro: 60s, Hobby: 10s

/**
 * POST /api/documents/process
 *
 * Processes a single document: extract text → Claude analysis → chunk → save.
 * Body: { documentId: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { documentId } = await request.json()
    if (!documentId) {
      return NextResponse.json({ error: 'documentId é obrigatório' }, { status: 400 })
    }

    // Fetch document record
    const { data: doc, error: docError } = await supabase
      .from('user_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
    }

    if (doc.processing_status === 'indexed') {
      return NextResponse.json({ ok: true, status: 'already_indexed' })
    }

    // Update status to extracting
    await supabase
      .from('user_documents')
      .update({ processing_status: 'extracting' })
      .eq('id', documentId)

    // Step 1: Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('user-documents')
      .download(doc.file_path)

    if (downloadError || !fileData) {
      await supabase
        .from('user_documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId)
      return NextResponse.json({ error: 'Erro ao baixar arquivo' }, { status: 500 })
    }

    // Step 2: Extract text based on mime type
    let extractedText = ''
    let pageCount: number | null = null

    const buffer = Buffer.from(await fileData.arrayBuffer())

    if (doc.mime_type === 'application/pdf') {
      try {
        const result = await extractPdfText(buffer)
        extractedText = result.text
        pageCount = result.pageCount
      } catch (e) {
        console.error('PDF extraction error:', e)
        extractedText = '[Erro na extração de texto do PDF]'
      }
    } else if (doc.mime_type.startsWith('image/')) {
      // For images, we store a placeholder — full OCR would need Claude Vision
      extractedText = '[Documento é uma imagem — processamento via OCR pendente]'
    } else {
      extractedText = '[Formato não suportado para extração de texto]'
    }

    if (!extractedText || extractedText.length < 10) {
      await supabase
        .from('user_documents')
        .update({
          processing_status: 'failed',
          extracted_text: extractedText || null,
        })
        .eq('id', documentId)
      return NextResponse.json({ ok: false, status: 'extraction_failed' })
    }

    // Update status to analyzing
    await supabase
      .from('user_documents')
      .update({ processing_status: 'analyzing', extracted_text: extractedText })
      .eq('id', documentId)

    // Step 3: Analyze with Claude
    let analysis = null
    try {
      // Get discipline name for context
      let disciplineName: string | undefined
      if (doc.discipline_id) {
        const { data: disc } = await supabase
          .from('disciplines')
          .select('name')
          .eq('id', doc.discipline_id)
          .single()
        disciplineName = disc?.name ?? undefined
      }

      analysis = await analyzeDocument(extractedText, {
        fileName: doc.file_name,
        disciplineName,
      })
    } catch (e) {
      console.error('Analysis error:', e)
      // Analysis failure is non-fatal — we still have the text
    }

    // Step 4: Chunk the text
    const chunks = chunkText(extractedText)

    // Step 5: Save chunks to database
    if (chunks.length > 0) {
      const chunkRows = chunks.map((chunk) => ({
        document_id: documentId,
        user_id: user.id,
        chunk_index: chunk.chunk_index,
        content: chunk.content,
        token_count: chunk.token_count,
        page_number: chunk.page_number,
        section_title: chunk.section_title,
        chunk_type: chunk.chunk_type,
      }))

      // Insert in batches of 50
      for (let i = 0; i < chunkRows.length; i += 50) {
        const batch = chunkRows.slice(i, i + 50)
        await supabase.from('document_chunks').insert(batch)
      }
    }

    // Step 6: Update document with results
    await supabase
      .from('user_documents')
      .update({
        processing_status: 'indexed',
        extracted_text: extractedText,
        ai_analysis: analysis,
        doc_type: analysis?.doc_type || doc.doc_type,
        doc_type_confidence: analysis?.confidence || null,
        page_count: pageCount,
        word_count: countWords(extractedText),
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    return NextResponse.json({
      ok: true,
      status: 'indexed',
      analysis,
      chunks: chunks.length,
      pageCount,
      wordCount: countWords(extractedText),
    })
  } catch (error) {
    console.error('Document process error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
