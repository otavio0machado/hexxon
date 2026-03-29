// ============================================================
// AI ROUTER — Roteamento inteligente entre providers
// Decide qual provider/modelo usar por serviço, com fallback automático
// ============================================================

import { callAnthropic, parseJSON } from './anthropic'
import { callGeminiGeneric } from './gemini'
import type { AIResponse } from './types'

// ── Provider types ──

export type AIProvider = 'gemini' | 'anthropic'
export type AITier = 1 | 2 | 3

export interface ServiceRoute {
  provider: AIProvider
  model: string
  tier: AITier
  /** Provider de fallback se o primário falhar */
  fallbackProvider?: AIProvider
  fallbackModel?: string
}

// ── Mapeamento serviço → provider/modelo ──
// Tier 1: Gemini Flash (free) — tarefas simples de geração/classificação
// Tier 2: Sonnet / Gemini Pro — raciocínio médio
// Tier 3: Opus — conversas complexas, missões

const SERVICE_ROUTES: Record<string, ServiceRoute> = {
  // ── Tier 1: Gemini 2.5 Flash (FREE) ──
  'classifyError':        { provider: 'gemini', model: 'gemini-2.5-flash', tier: 1, fallbackProvider: 'anthropic', fallbackModel: 'claude-haiku-4-5-20251001' },
  'generateFlashcards':   { provider: 'gemini', model: 'gemini-2.5-flash', tier: 1, fallbackProvider: 'anthropic', fallbackModel: 'claude-haiku-4-5-20251001' },
  'generateExercises':    { provider: 'gemini', model: 'gemini-2.5-flash', tier: 1, fallbackProvider: 'anthropic', fallbackModel: 'claude-haiku-4-5-20251001' },
  'explainTopic':         { provider: 'gemini', model: 'gemini-2.5-flash', tier: 1, fallbackProvider: 'anthropic', fallbackModel: 'claude-sonnet-4-6' },
  'generateNotes':        { provider: 'gemini', model: 'gemini-2.5-flash', tier: 1, fallbackProvider: 'anthropic', fallbackModel: 'claude-haiku-4-5-20251001' },
  'summarizeDocument':    { provider: 'gemini', model: 'gemini-2.5-flash', tier: 1, fallbackProvider: 'anthropic', fallbackModel: 'claude-haiku-4-5-20251001' },
  'generateNoteGraph':    { provider: 'gemini', model: 'gemini-2.5-flash', tier: 1, fallbackProvider: 'anthropic', fallbackModel: 'claude-haiku-4-5-20251001' },
  'document-analysis':    { provider: 'gemini', model: 'gemini-2.5-flash', tier: 1, fallbackProvider: 'anthropic', fallbackModel: 'claude-haiku-4-5-20251001' },
  'bootstrap-flashcards': { provider: 'gemini', model: 'gemini-2.5-flash', tier: 1, fallbackProvider: 'anthropic', fallbackModel: 'claude-sonnet-4-6' },

  // ── Tier 2: Sonnet (médio) ──
  'generateExamPlan':         { provider: 'anthropic', model: 'claude-sonnet-4-6', tier: 2 },
  'tutor':                    { provider: 'anthropic', model: 'claude-sonnet-4-6', tier: 2 },
  'generateNoteInteractive':  { provider: 'gemini', model: 'gemini-2.5-flash', tier: 1, fallbackProvider: 'anthropic', fallbackModel: 'claude-sonnet-4-6' },
  'bootstrap-curriculum':     { provider: 'anthropic', model: 'claude-sonnet-4-6', tier: 2 },

  'generateMindmap':          { provider: 'anthropic', model: 'claude-sonnet-4-6', tier: 2 },

  // ── Tier 3: Opus (complexo) — esses NÃO passam pelo router, usam direto ──
  // hexxon-ai-conversation, createMission, prepareExamKit
}

// ── Default route para serviços não mapeados ──

const DEFAULT_ROUTE: ServiceRoute = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-6',
  tier: 2,
}

// ── Tipo do callAI options (unificado) ──

export interface CallAIOptions {
  service: string
  system: string
  userMessage: string
  model?: string       // Override manual (ignora roteamento)
  maxTokens?: number
  temperature?: number
  signal?: AbortSignal
  /** Forçar um provider específico */
  forceProvider?: AIProvider
}

// ── Core: callAI ──

/**
 * Ponto de entrada unificado para todas as chamadas AI.
 * Roteia automaticamente para o provider/modelo mais eficiente.
 * Faz fallback para Anthropic se Gemini falhar.
 */
export async function callAI<T>(
  options: CallAIOptions,
  parser: (raw: string) => T = parseJSON as (raw: string) => T
): Promise<AIResponse<T>> {
  const route = SERVICE_ROUTES[options.service] ?? DEFAULT_ROUTE

  // Override manual tem prioridade
  const provider = options.forceProvider ?? route.provider
  const model = options.model ?? route.model

  const callOptions = {
    service: options.service,
    system: options.system,
    userMessage: options.userMessage,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    signal: options.signal,
  }

  // ── Tentar provider primário ──
  try {
    if (provider === 'gemini') {
      return await callGeminiGeneric<T>(
        { ...callOptions, model },
        parser
      )
    } else {
      return await callAnthropic<T>(
        { ...callOptions, model, allowFallback: false },
        parser
      )
    }
  } catch (primaryError) {
    // ── Fallback se disponível ──
    if (route.fallbackProvider && route.fallbackProvider !== provider) {
      console.warn(
        `[AI Router] ${options.service}: ${provider}/${model} falhou, tentando fallback ${route.fallbackProvider}/${route.fallbackModel}...`
      )

      try {
        if (route.fallbackProvider === 'anthropic') {
          return await callAnthropic<T>(
            { ...callOptions, model: route.fallbackModel ?? 'claude-sonnet-4-6', allowFallback: true },
            parser
          )
        } else {
          return await callGeminiGeneric<T>(
            { ...callOptions, model: route.fallbackModel ?? 'gemini-2.5-flash' },
            parser
          )
        }
      } catch (fallbackError) {
        console.error(`[AI Router] ${options.service}: Fallback também falhou`, fallbackError)
        throw fallbackError
      }
    }

    throw primaryError
  }
}

/**
 * Retorna a rota configurada para um serviço (útil para debug/logging).
 */
export function getServiceRoute(service: string): ServiceRoute {
  return SERVICE_ROUTES[service] ?? DEFAULT_ROUTE
}

/**
 * Lista todas as rotas configuradas (para dashboard de admin).
 */
export function getAllRoutes(): Record<string, ServiceRoute> {
  return { ...SERVICE_ROUTES }
}
