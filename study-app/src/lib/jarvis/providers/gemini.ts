import { GoogleGenAI, Type } from '@google/genai'
import type { ProviderRequest, ProviderResponse, ToolCall } from '../types'

function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured')
  return new GoogleGenAI({ apiKey })
}

export async function callGemini(
  model: string,
  request: ProviderRequest
): Promise<ProviderResponse> {
  const startTime = Date.now()
  const ai = getClient()

  // Convert tools to Gemini format
  const tools = request.tools?.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: Type.OBJECT as const,
      properties: Object.fromEntries(
        Object.entries(t.input_schema.properties).map(([key, val]) => [
          key,
          val as Record<string, unknown>,
        ])
      ),
      required: t.input_schema.required,
    },
  }))

  const config: Record<string, unknown> = {
    temperature: request.temperature,
    maxOutputTokens: request.maxTokens,
  }

  if (tools && tools.length > 0) {
    config.tools = [{ functionDeclarations: tools }]
  }

  // Build contents from messages
  const contents = request.messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      ...config,
      systemInstruction: request.systemPrompt,
    },
  })

  // Extract content and tool calls
  let content = ''
  const toolCalls: ToolCall[] = []

  if (response.candidates && response.candidates[0]) {
    const parts = response.candidates[0].content?.parts ?? []
    for (const part of parts) {
      if (part.text) {
        content += part.text
      }
      if (part.functionCall) {
        toolCalls.push({
          id: `gemini_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: part.functionCall.name ?? '',
          arguments: (part.functionCall.args ?? {}) as Record<string, unknown>,
        })
      }
    }
  }

  const usage = response.usageMetadata
  return {
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    },
    model,
    durationMs: Date.now() - startTime,
  }
}
