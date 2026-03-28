// ============================================================
// ANTHROPIC CLIENT — Server-side only
// Ponto único de acesso à API. Nunca importar no client.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import type { AIServiceConfig, AIResponse, AIError } from "./types";

// ── Constantes ──

const DEFAULT_MODEL = "claude-opus-4-6";
const FALLBACK_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 1024;
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 1000;

// Custo por 1M tokens (USD) — atualizar conforme pricing Anthropic
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-6":   { input: 15.0,  output: 75.0 },
  "claude-sonnet-4-6": { input: 3.0,   output: 15.0 },
  "claude-haiku-4-5-20251001":  { input: 0.80,  output: 4.0  },
};

// ── Singleton client ──

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "[AI] ANTHROPIC_API_KEY não configurada. Adicione ao .env.local"
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// ── Logger ──

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, service: string, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const prefix = `[AI:${service}]`;
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";

  if (level === "error") {
    console.error(`${timestamp} ${prefix} ${message}${metaStr}`);
  } else if (level === "warn") {
    console.warn(`${timestamp} ${prefix} ${message}${metaStr}`);
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${timestamp} ${prefix} ${message}${metaStr}`);
    }
  }
}

// ── Custo estimado ──

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] ?? PRICING[DEFAULT_MODEL];
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

// ── Error mapping ──

function mapError(err: unknown): AIError {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 429) {
      return {
        code: "RATE_LIMIT",
        message: "Rate limit atingido. Aguarde antes de tentar novamente.",
        retryAfterMs: 60_000,
      };
    }
    if (err.status === 401) {
      return { code: "AUTH_ERROR", message: "API key inválida ou expirada." };
    }
    if (err.status === 400 && err.message?.includes("context")) {
      return { code: "CONTEXT_LENGTH", message: "Input excede o contexto máximo." };
    }
  }
  if (err instanceof Error && err.name === "AbortError") {
    return { code: "TIMEOUT", message: "Requisição cancelada por timeout." };
  }
  return {
    code: "UNKNOWN",
    message: err instanceof Error ? err.message : "Erro desconhecido na API.",
  };
}

// ── Core: callAnthropic ──

export interface CallOptions extends AIServiceConfig {
  /** Nome do serviço (para logs) */
  service: string;
  /** System prompt */
  system: string;
  /** User message */
  userMessage: string;
  /** Se true, tenta fallback model em caso de erro */
  allowFallback?: boolean;
}

/**
 * Chamada principal à API Anthropic.
 * Inclui: retry automático, fallback model, logging, cálculo de custo.
 */
export async function callAnthropic<T>(
  options: CallOptions,
  parser: (raw: string) => T
): Promise<AIResponse<T>> {
  const {
    service,
    system,
    userMessage,
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = 0.3,
    signal,
    allowFallback = true,
  } = options;

  const client = getClient();
  let lastError: AIError | null = null;
  const modelsToTry = allowFallback ? [model, FALLBACK_MODEL] : [model];

  for (const currentModel of modelsToTry) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const start = Date.now();

      try {
        log("info", service, `Chamando ${currentModel}`, {
          attempt,
          maxTokens,
          temperature,
          inputLength: system.length + userMessage.length,
        });

        const response = await client.messages.create({
          model: currentModel,
          max_tokens: maxTokens,
          temperature,
          system,
          messages: [{ role: "user", content: userMessage }],
          ...(signal ? {} : {}), // AbortSignal handled at fetch level
        });

        const durationMs = Date.now() - start;
        const rawText =
          response.content[0].type === "text" ? response.content[0].text : "";

        const inputTokens = response.usage.input_tokens;
        const outputTokens = response.usage.output_tokens;
        const cost = estimateCost(currentModel, inputTokens, outputTokens);

        log("info", service, `Resposta recebida`, {
          model: currentModel,
          durationMs,
          inputTokens,
          outputTokens,
          costUSD: cost.toFixed(6),
          stopReason: response.stop_reason,
        });

        const parsed = parser(rawText);

        return {
          data: parsed,
          usage: {
            inputTokens,
            outputTokens,
            estimatedCostUSD: cost,
          },
          model: currentModel,
          durationMs,
        };
      } catch (err) {
        const durationMs = Date.now() - start;
        lastError = mapError(err);

        log("error", service, `Erro (attempt ${attempt})`, {
          model: currentModel,
          durationMs,
          errorCode: lastError.code,
          errorMessage: lastError.message,
        });

        // Não fazer retry em erros de auth ou context
        if (lastError.code === "AUTH_ERROR" || lastError.code === "CONTEXT_LENGTH") {
          break;
        }

        // Retry com backoff exponencial
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_MS * Math.pow(2, attempt);
          log("warn", service, `Retry em ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam com este modelo
    if (lastError?.code === "AUTH_ERROR") break; // Não adianta trocar modelo
    log("warn", service, `Fallback para próximo modelo...`);
  }

  // Todas as tentativas e modelos falharam
  throw lastError ?? { code: "UNKNOWN", message: "Falha completa na API." };
}

// ── JSON parser seguro ──

/**
 * Extrai JSON de uma resposta que pode conter markdown ```json ... ```
 * Também tenta reparar JSON truncado (quando maxTokens corta a resposta).
 */
export function parseJSON<T>(raw: string): T {
  // Remove markdown code fences se presentes
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  // Remove any trailing text after the JSON (Claude sometimes adds commentary)
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const startIdx = firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);
  if (startIdx > 0) {
    cleaned = cleaned.slice(startIdx);
  }

  // Try direct parse first
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to repair truncated JSON by closing open brackets/braces
    try {
      const repaired = repairTruncatedJSON(cleaned);
      return JSON.parse(repaired) as T;
    } catch {
      throw new Error(`[AI] Falha ao parsear JSON da resposta: ${cleaned.slice(0, 200)}...`);
    }
  }
}

/**
 * Attempts to repair truncated JSON by closing unclosed brackets/braces.
 * Handles cases where maxTokens cuts off the response mid-JSON.
 */
function repairTruncatedJSON(json: string): string {
  let repaired = json.trim();

  // Remove trailing comma
  repaired = repaired.replace(/,\s*$/, "");

  // Remove incomplete string at the end (trailing unclosed quote)
  // Find if we have an unclosed string
  let inString = false;
  let escaped = false;
  let lastCompleteIdx = 0;

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      if (!inString) {
        lastCompleteIdx = i;
      }
    } else if (!inString) {
      if (ch === "}" || ch === "]" || ch === "," || ch === ":") {
        lastCompleteIdx = i;
      }
    }
  }

  // If we're inside an unclosed string, truncate to last complete point
  if (inString) {
    repaired = repaired.slice(0, lastCompleteIdx + 1);
    // Remove trailing comma
    repaired = repaired.replace(/,\s*$/, "");
  }

  // Count unclosed brackets/braces and close them
  const stack: string[] = [];
  inString = false;
  escaped = false;

  for (const ch of repaired) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    }
  }

  // Close all unclosed brackets/braces
  while (stack.length > 0) {
    repaired += stack.pop();
  }

  return repaired;
}

// ── Helpers de contexto ──

/**
 * Monta o contexto do aluno para system prompts
 */
export function buildStudentContext(data: {
  courseName: string;
  topicName: string;
  masteryLevel: string;
  prerequisites?: string[];
}): string {
  const lines = [
    `Disciplina: ${data.courseName}`,
    `Tópico: ${data.topicName}`,
    `Nível de domínio do aluno: ${data.masteryLevel}`,
  ];
  if (data.prerequisites?.length) {
    lines.push(`Pré-requisitos dominados: ${data.prerequisites.join(", ")}`);
  }
  return lines.join("\n");
}

// ── Re-exports ──

export { estimateCost, PRICING, DEFAULT_MODEL, FALLBACK_MODEL };
