import Anthropic from '@anthropic-ai/sdk'
import type { ProviderRequest, ProviderResponse, ToolCall } from '../types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function callClaude(
  model: string,
  request: ProviderRequest
): Promise<ProviderResponse> {
  const startTime = Date.now()

  // Build messages array for Anthropic API
  const messages = request.messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Build tools array if provided
  const tools = request.tools?.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Tool.InputSchema,
  }))

  const apiRequest: Anthropic.MessageCreateParams = {
    model,
    max_tokens: request.maxTokens,
    temperature: request.temperature,
    system: request.systemPrompt,
    messages,
    ...(tools && tools.length > 0 ? { tools } : {}),
  }

  const response = await client.messages.create(apiRequest)

  // Extract text content and tool calls
  let content = ''
  const toolCalls: ToolCall[] = []

  for (const block of response.content) {
    if (block.type === 'text') {
      content += block.text
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        name: block.name,
        arguments: block.input as Record<string, unknown>,
      })
    }
  }

  return {
    content,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    model: response.model,
    durationMs: Date.now() - startTime,
  }
}
