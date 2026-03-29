import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/claim-legacy-data
 *
 * Assigns all rows with user_id = NULL to the currently authenticated user.
 * This is a one-time migration endpoint for the first user (Otávio) to claim
 * pre-existing data. After this runs, all legacy data belongs to the user.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const tables = [
      'disciplines', 'modules', 'topics', 'assessments', 'assessment_topics',
      'exercises', 'attempts', 'error_occurrences', 'notes', 'flashcards',
      'oral_questions', 'study_sessions', 'kg_nodes', 'kg_edges',
      'hexxonai_conversations', 'hexxonai_messages', 'hexxonai_insights',
      'learning_events', 'topic_memory_state', 'exam_simulations', 'ai_usage_log',
    ]

    const results: Record<string, number> = {}

    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .update({ user_id: user.id }, { count: 'exact' })
        .is('user_id', null)

      results[table] = count ?? 0
    }

    return NextResponse.json({
      message: 'Dados legados atribuídos com sucesso',
      userId: user.id,
      results,
    })
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    )
  }
}
