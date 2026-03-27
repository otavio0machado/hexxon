// ============================================================
// GEMINI CLIENT — Server-side only
// Interface compatível com callAnthropic para intercâmbio transparente
// ============================================================

import { GoogleGenAI } from '@google/genai'
import type { AIServiceConfig, AIResponse, AIError } from './types'

// ── Constantes ──

const DEFAULT_MODEL = 'gemini-2.5-flash'
const MAX_RETRIES = 2
const RETRY_BASE_MS = 1000

// Custo por 1M tokens (USD) — Gemini free tier = $0
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash':       { input: 0, output: 0 },     // Free tier
  'gemini-2.5-pro':         { input: 1.25, output: 10.0 },
  'gemini-2.0-flash':       { input: 0, output: 0 },     // Free tier
}

// ── Singleton client ──

let _client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error('[AI] GOOGLE_AI_API_KEY não configurada. Adicione ao .env.local')
    }
    _client = new GoogleGenAI({ apiKey })
  }
  return _client
}

// ── Logger ──

type LogLevel = 'info' | 'warn' | 'error'

function log(level: LogLevel, service: string, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  const prefix = `[Gemini:${service}]`
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''

  if (level === 'error') {
    console.error(`${timestamp} ${prefix} ${message}${metaStr}`)
  } else if (level === 'warn') {
    console.warn(`${timestamp} ${prefix} ${message}${metaStr}`)
  } else {
    console.log(`${timestamp} ${prefix} ${message}${metaStr}`)
  }
}

// ── Custo estimado ──

function estimateCostGemini(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] ?? PRICING[DEFAULT_MODEL]
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}

// ── Error mapping ──

function mapError(err: unknown): AIError {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    if (msg.includes('429') || msg.includes('rate') || msg.includes('quota')) {
      return { code: 'RATE_LIMIT', message: 'Rate limit Gemini atingido.', retryAfterMs: 60_000 }
    }
    if (msg.includes('401') || msg.includes('api key') || msg.includes('authentication')) {
      return { code: 'AUTH_ERROR', message: 'API key Gemini inválida ou expirada.' }
    }
    if (msg.includes('context') || msg.includes('too long') || msg.includes('token')) {
      return { code: 'CONTEXT_LENGTH', message: 'Input excede o contexto máximo do Gemini.' }
    }
    return { code: 'UNKNOWN', message: err.message }
  }
  return { code: 'UNKNOWN', message: 'Erro desconhecido na API Gemini.' }
}

// ── Core: callGeminiGeneric ──

export interface GeminiCallOptions extends AIServiceConfig {
  service: string
  system: string
  userMessage: string
}

/**
 * Chamada genérica à API Gemini.
 * Mesma interface de retorno que callAnthropic para intercâmbio transparente.
 */
export async function callGeminiGeneric<T>(
  options: GeminiCallOptions,
  parser: (raw: string) => T
): Promise<AIResponse<T>> {
  const {
    service,
    system,
    userMessage,
    model = DEFAULT_MODEL,
    maxTokens = 1024,
    temperature = 0.3,
  } = options

  const client = getClient()
  let lastError: AIError | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const start = Date.now()

    try {
      log('info', service, `Chamando ${model}`, {
        attempt,
        maxTokens,
        temperature,
        inputLength: system.length + userMessage.length,
      })

      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: system,
          temperature,
          maxOutputTokens: maxTokens,
        },
      })

      const durationMs = Date.now() - start

      // Extract text
      let rawText = ''
      if (response.candidates && response.candidates[0]) {
        const parts = response.candidates[0].content?.parts ?? []
        for (const part of parts) {
          if (part.text) rawText += part.text
        }
      }

      if (!rawText) {
        throw new Error('Gemini retornou resposta vazia')
      }

      const usage = response.usageMetadata
      const inputTokens = usage?.promptTokenCount ?? 0
      const outputTokens = usage?.candidatesTokenCount ?? 0
      const cost = estimateCostGemini(model, inputTokens, outputTokens)

      log('info', service, 'Resposta recebida', {
        model,
        durationMs,
        inputTokens,
        outputTokens,
        costUSD: cost.toFixed(6),
      })

      const parsed = parser(rawText)

      return {
        data: parsed,
        usage: {
          inputTokens,
          outputTokens,
          estimatedCostUSD: cost,
        },
        model,
        durationMs,
      }
    } catch (err) {
      const durationMs = Date.now() - start
      lastError = mapError(err)

      log('error', service, `Erro (attempt ${attempt})`, {
        model,
        durationMs,
        errorCode: lastError.code,
        errorMessage: lastError.message,
      })

      // Não retry em erros de auth ou context
      if (lastError.code === 'AUTH_ERROR' || lastError.code === 'CONTEXT_LENGTH') {
        break
      }

      // Retry com backoff
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt)
        log('warn', service, `Retry em ${delay}ms...`)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  throw lastError ?? { code: 'UNKNOWN', message: 'Falha completa na API Gemini.' }
}

export { PRICING as GEMINI_PRICING, DEFAULT_MODEL as GEMINI_DEFAULT_MODEL }
