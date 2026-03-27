// ============================================================
// JARVIS — API Route
// POST /api/jarvis — Main endpoint for Jarvis interactions
// ============================================================

import { NextResponse } from 'next/server'
import { orchestrate } from '@/lib/jarvis/orchestrator'
import { buildContext } from '@/lib/jarvis/context'
import type { ModelId, JarvisMessage } from '@/lib/jarvis/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      messages,
      model,
      currentPage,
      disciplineId,
      topicId,
    } = body as {
      messages: JarvisMessage[]
      model: ModelId
      currentPage?: string
      disciplineId?: string
      topicId?: string
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      )
    }

    // Build context from current app state
    const context = await buildContext(
      currentPage ?? '/',
      disciplineId,
      topicId,
    )

    // Run orchestrator
    const result = await orchestrate(messages, model, context)

    return NextResponse.json({
      message: result.message,
      toolsExecuted: result.toolsExecuted,
    })
  } catch (error) {
    console.error('[Jarvis API Error]', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const statusCode = errorMessage.includes('API key') ? 401
      : errorMessage.includes('rate') ? 429
      : errorMessage.includes('not found') ? 404
      : 500

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
