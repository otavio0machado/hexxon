// ============================================================
// JARVIS — Insights API
// GET /api/jarvis/insights — Get active insights
// POST /api/jarvis/insights — Generate new insights
// ============================================================

import { NextResponse } from 'next/server'
import { getActiveInsights, generateInsights, markInsightRead, generateDailyBriefing } from '@/lib/services/insights-engine'

export async function GET() {
  try {
    const insights = await getActiveInsights()
    return NextResponse.json({ insights })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, insightId } = body as { action?: string; insightId?: string }

    if (action === 'generate') {
      const insights = await generateInsights('api_manual')
      return NextResponse.json({ insights, count: insights.length })
    }

    if (action === 'briefing') {
      const briefing = await generateDailyBriefing()
      return NextResponse.json({ briefing })
    }

    if (action === 'mark_read' && insightId) {
      await markInsightRead(insightId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
