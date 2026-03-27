// ============================================================
// JARVIS — Orchestrator
// Routes requests to providers, executes tools, synthesizes
// ============================================================

import type {
  ModelId,
  JarvisMessage,
  JarvisContext,
  OrchestratorResponse,
  ProviderResponse,
  ToolResult,
  PostAction,
  MixSource,
  MODELS,
} from './types'
import { MODELS as ModelRegistry } from './types'
import { callClaude } from './providers/claude'
import { callGemini } from './providers/gemini'
import { buildSystemPrompt } from './context'
import { toProviderTools, executeTool } from './tools'
import { supabase } from '@/lib/supabase'

// ── Main Entry Point ────────────────────────────────────────

export async function orchestrate(
  messages: JarvisMessage[],
  model: ModelId,
  context: JarvisContext,
): Promise<OrchestratorResponse> {
  const systemPrompt = buildSystemPrompt(context)
  const providerTools = toProviderTools()

  if (model === 'mix') {
    return executeMixMode(messages, context, systemPrompt, providerTools)
  }

  return executeSingleModel(messages, model, systemPrompt, providerTools)
}

// ── Single Model Execution ──────────────────────────────────

async function executeSingleModel(
  messages: JarvisMessage[],
  model: ModelId,
  systemPrompt: string,
  providerTools: ReturnType<typeof toProviderTools>,
): Promise<OrchestratorResponse> {
  const modelInfo = ModelRegistry[model]
  if (!modelInfo) throw new Error(`Model ${model} not found`)

  const conversationMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Call provider
  let response: ProviderResponse

  if (modelInfo.provider === 'anthropic') {
    response = await callClaude(model, {
      systemPrompt,
      messages: conversationMessages,
      tools: providerTools,
      maxTokens: modelInfo.maxTokens,
      temperature: 0.4,
    })
  } else if (modelInfo.provider === 'google') {
    response = await callGemini(model, {
      systemPrompt,
      messages: conversationMessages,
      tools: providerTools,
      maxTokens: modelInfo.maxTokens,
      temperature: 0.4,
    })
  } else {
    throw new Error(`Unknown provider for model ${model}`)
  }

  // Execute tool calls if any
  const toolResults: ToolResult[] = []
  let finalContent = response.content

  if (response.toolCalls && response.toolCalls.length > 0) {
    for (const tc of response.toolCalls) {
      const result = await executeTool(tc.name, tc.arguments, tc.id)
      toolResults.push(result)
    }

    // If tools were called, make a follow-up call with tool results
    const toolResultsSummary = toolResults.map(r =>
      `[Tool ${r.toolCallId}]: ${r.success ? '✓' : '✗'} ${r.message}`
    ).join('\n')

    const followUpMessages = [
      ...conversationMessages,
      { role: 'assistant' as const, content: response.content || 'Executando ações...' },
      { role: 'user' as const, content: `Resultados das ferramentas:\n${toolResultsSummary}\n\nResuma o que foi feito e sugira próximos passos.` },
    ]

    let followUp: ProviderResponse

    if (modelInfo.provider === 'anthropic') {
      followUp = await callClaude(model, {
        systemPrompt,
        messages: followUpMessages,
        maxTokens: modelInfo.maxTokens,
        temperature: 0.4,
      })
    } else {
      followUp = await callGemini(model, {
        systemPrompt,
        messages: followUpMessages,
        maxTokens: modelInfo.maxTokens,
        temperature: 0.4,
      })
    }

    finalContent = followUp.content
    response.usage.inputTokens += followUp.usage.inputTokens
    response.usage.outputTokens += followUp.usage.outputTokens
    response.durationMs += followUp.durationMs
  }

  // Generate post-actions based on context
  const postActions = generatePostActions(finalContent, toolResults, messages)

  // Estimate cost
  const costInput = (response.usage.inputTokens / 1000) * modelInfo.costPer1kInput
  const costOutput = (response.usage.outputTokens / 1000) * modelInfo.costPer1kOutput
  const totalCost = costInput + costOutput

  // Log usage
  await logUsage(model, response.usage.inputTokens, response.usage.outputTokens, totalCost, response.durationMs)

  const assistantMessage: JarvisMessage = {
    id: `jarvis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content: finalContent,
    model,
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    postActions: postActions.length > 0 ? postActions : undefined,
    meta: {
      model: response.model,
      durationMs: response.durationMs,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      estimatedCostUsd: totalCost,
    },
    timestamp: Date.now(),
  }

  return { message: assistantMessage, toolsExecuted: toolResults }
}

// ── Mix Mode ────────────────────────────────────────────────

async function executeMixMode(
  messages: JarvisMessage[],
  context: JarvisContext,
  systemPrompt: string,
  providerTools: ReturnType<typeof toProviderTools>,
): Promise<OrchestratorResponse> {
  // Send to multiple models in parallel
  const mixModels: ModelId[] = []

  // Always include one Claude model
  if (process.env.ANTHROPIC_API_KEY) {
    mixModels.push('claude-sonnet-4-6')
  }
  // Include Gemini if available
  if (process.env.GOOGLE_AI_API_KEY) {
    mixModels.push('gemini-2.5-flash')
  }
  // If we only have one provider, add a second model from same provider
  if (mixModels.length === 1 && process.env.ANTHROPIC_API_KEY) {
    mixModels.push('claude-haiku-4-5-20251001')
  }

  if (mixModels.length === 0) {
    throw new Error('No AI providers configured for Mix mode')
  }

  const conversationMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Call all models in parallel
  const results = await Promise.allSettled(
    mixModels.map(async (modelId) => {
      const modelInfo = ModelRegistry[modelId]
      const start = Date.now()
      let resp: ProviderResponse

      if (modelInfo.provider === 'anthropic') {
        resp = await callClaude(modelId, {
          systemPrompt,
          messages: conversationMessages,
          tools: providerTools,
          maxTokens: modelInfo.maxTokens,
          temperature: 0.4,
        })
      } else {
        resp = await callGemini(modelId, {
          systemPrompt,
          messages: conversationMessages,
          tools: providerTools,
          maxTokens: modelInfo.maxTokens,
          temperature: 0.4,
        })
      }

      return {
        modelId,
        content: resp.content,
        toolCalls: resp.toolCalls,
        durationMs: Date.now() - start,
        tokensUsed: resp.usage.inputTokens + resp.usage.outputTokens,
      }
    })
  )

  const successResults = results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<{
      modelId: ModelId
      content: string
      toolCalls?: ProviderResponse['toolCalls']
      durationMs: number
      tokensUsed: number
    }>).value)

  if (successResults.length === 0) {
    throw new Error('All models failed in Mix mode')
  }

  // Execute tools from the first model that requested them
  const toolResults: ToolResult[] = []
  for (const result of successResults) {
    if (result.toolCalls && result.toolCalls.length > 0) {
      for (const tc of result.toolCalls) {
        const toolResult = await executeTool(tc.name, tc.arguments, tc.id)
        toolResults.push(toolResult)
      }
      break // Only execute tools from one model
    }
  }

  // Synthesize responses using the strongest available model
  const synthesisModel = process.env.ANTHROPIC_API_KEY ? 'claude-sonnet-4-6' : mixModels[0]
  const synthesisModelInfo = ModelRegistry[synthesisModel]

  const responsesText = successResults.map((r, i) =>
    `--- Resposta ${i + 1} (${ModelRegistry[r.modelId].name}) ---\n${r.content}`
  ).join('\n\n')

  const synthesisMessages = [
    ...conversationMessages,
    {
      role: 'user' as const,
      content: `Múltiplas IAs responderam à última pergunta. Sintetize uma resposta final que combine o melhor de cada uma.\n\n${responsesText}\n\n${toolResults.length > 0 ? `Ferramentas executadas:\n${toolResults.map(r => `- ${r.message}`).join('\n')}\n\n` : ''}Gere a melhor resposta possível, combinando os pontos fortes de cada IA. Não mencione que houve múltiplas respostas.`,
    },
  ]

  let synthesisResponse: ProviderResponse
  if (synthesisModelInfo.provider === 'anthropic') {
    synthesisResponse = await callClaude(synthesisModel, {
      systemPrompt,
      messages: synthesisMessages,
      maxTokens: synthesisModelInfo.maxTokens,
      temperature: 0.3,
    })
  } else {
    synthesisResponse = await callGemini(synthesisModel, {
      systemPrompt,
      messages: synthesisMessages,
      maxTokens: synthesisModelInfo.maxTokens,
      temperature: 0.3,
    })
  }

  const mixSources: MixSource[] = successResults.map(r => ({
    model: r.modelId,
    content: r.content,
    durationMs: r.durationMs,
    tokensUsed: r.tokensUsed,
  }))

  const totalDuration = successResults.reduce((sum, r) => sum + r.durationMs, 0) + synthesisResponse.durationMs
  const postActions = generatePostActions(synthesisResponse.content, toolResults, messages)

  const assistantMessage: JarvisMessage = {
    id: `jarvis_mix_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content: synthesisResponse.content,
    model: 'mix',
    toolResults: toolResults.length > 0 ? toolResults : undefined,
    postActions: postActions.length > 0 ? postActions : undefined,
    mixSources,
    meta: {
      model: 'mix',
      durationMs: totalDuration,
      inputTokens: successResults.reduce((s, r) => s + r.tokensUsed, 0),
      outputTokens: synthesisResponse.usage.outputTokens,
      estimatedCostUsd: 0, // Complex to calculate for mix
    },
    timestamp: Date.now(),
  }

  return { message: assistantMessage, toolsExecuted: toolResults }
}

// ── Post-Action Generation ──────────────────────────────────

function generatePostActions(content: string, toolResults: ToolResult[], messages: JarvisMessage[]): PostAction[] {
  const actions: PostAction[] = []
  const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() ?? ''
  const contentLower = content.toLowerCase()

  // If the response explains a concept, offer to create notes/flashcards
  if (contentLower.includes('definição') || contentLower.includes('teorema') || contentLower.includes('conceito') || contentLower.includes('fórmula') || lastUserMsg.includes('explica') || lastUserMsg.includes('o que é')) {
    actions.push({
      id: `pa_note_${Date.now()}`,
      label: 'Criar nota com isso',
      icon: 'StickyNote',
      action: 'createNote',
      params: { content, title: 'Nota do Jarvis', format: 'summary' },
      variant: 'primary',
    })
    actions.push({
      id: `pa_flash_${Date.now()}`,
      label: 'Gerar flashcards',
      icon: 'Layers',
      action: 'generateFlashcards',
      params: { content },
      variant: 'secondary',
    })
  }

  // If response involves exercises, offer to practice more
  if (contentLower.includes('exercício') || contentLower.includes('questão') || contentLower.includes('resolva') || toolResults.some(r => r.data && typeof r.data === 'object')) {
    actions.push({
      id: `pa_exercise_${Date.now()}`,
      label: 'Gerar mais exercícios',
      icon: 'Dumbbell',
      action: 'generateExercises',
      params: {},
      variant: 'secondary',
    })
  }

  // If creating a study plan, offer to create session
  if (contentLower.includes('plano') || contentLower.includes('estud') || contentLower.includes('sessão')) {
    actions.push({
      id: `pa_session_${Date.now()}`,
      label: 'Registrar sessão de estudo',
      icon: 'Clock',
      action: 'createStudySession',
      params: { kind: 'study' },
      variant: 'ghost',
    })
  }

  return actions.slice(0, 4) // max 4 actions
}

// ── Usage Logging ───────────────────────────────────────────

async function logUsage(model: string, inputTokens: number, outputTokens: number, cost: number, durationMs: number) {
  try {
    await supabase.from('ai_usage_log').insert({
      service: 'jarvis',
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: cost,
      duration_ms: durationMs,
    })
  } catch {
    // Logging failure shouldn't break the flow
  }
}
