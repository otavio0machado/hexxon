'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  Clock,
  DollarSign,
  StickyNote,
  Layers,
  Dumbbell,
  Sparkles,
  Brain,
  X,
  Plus,
  Cpu,
} from 'lucide-react'
import type { JarvisMessage, ModelId, ModelInfo, PostAction, ToolResult, MixSource } from '@/lib/jarvis/types'
import { MODELS } from '@/lib/jarvis/types'

interface JarvisChatProps {
  mode: 'floating' | 'fullpage'
  currentPage?: string
  disciplineId?: string
  topicId?: string
}

const SUGGESTIONS = [
  { icon: Brain, text: 'Explica limites por definição epsilon-delta' },
  { icon: StickyNote, text: 'Crie flashcards sobre indução matemática' },
  { icon: Dumbbell, text: 'Gere um plano de estudo para a próxima prova' },
  { icon: Zap, text: 'Quais são meus tópicos mais fracos?' },
  { icon: Plus, text: 'Crie exercícios sobre derivadas' },
  { icon: Layers, text: 'Resuma o tópico de lógica proposicional' },
]

export function JarvisChat({
  mode,
  currentPage,
  disciplineId,
  topicId,
}: JarvisChatProps) {
  const [messages, setMessages] = useState<JarvisMessage[]>([])
  const [currentModel, setCurrentModel] = useState<ModelId>('claude-sonnet-4-6')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [expandedModelDropdown, setExpandedModelDropdown] = useState(false)
  const [expandedToolResults, setExpandedToolResults] = useState<Set<string>>(new Set())
  const [expandedMixSources, setExpandedMixSources] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMsg: JarvisMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          model: currentModel,
          currentPage,
          disciplineId,
          topicId,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao processar')
      }

      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExecuteAction = async (action: PostAction) => {
    const actionMessage = `Execute: ${action.id} with params ${JSON.stringify(action.params)}`
    await sendMessage(actionMessage)
  }

  const toggleToolResult = (toolId: string) => {
    setExpandedToolResults((prev) => {
      const next = new Set(prev)
      if (next.has(toolId)) {
        next.delete(toolId)
      } else {
        next.add(toolId)
      }
      return next
    })
  }

  const toggleMixSources = (messageId: string) => {
    setExpandedMixSources((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  const renderMarkdown = (text: string) => {
    const parts = []
    let lastIndex = 0

    const patterns = [
      { regex: /\*\*(.*?)\*\*/g, tag: 'strong' },
      { regex: /`(.*?)`/g, tag: 'code' },
      { regex: /\[(.*?)\]\((.*?)\)/g, tag: 'link' },
    ]

    let match
    const allMatches: Array<{
      start: number
      end: number
      type: string
      groups: string[]
    }> = []

    patterns.forEach(({ regex, tag }) => {
      while ((match = regex.exec(text)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: tag,
          groups: Array.from(match).slice(1),
        })
      }
    })

    allMatches.sort((a, b) => a.start - b.start)

    allMatches.forEach((match) => {
      if (match.start > lastIndex) {
        parts.push(text.slice(lastIndex, match.start))
      }

      if (match.type === 'strong') {
        parts.push(
          <strong key={`${match.start}_strong`} className="font-semibold text-text-fg-primary">
            {match.groups[0]}
          </strong>
        )
      } else if (match.type === 'code') {
        parts.push(
          <code
            key={`${match.start}_code`}
            className="bg-bg-tertiary text-accent-primary px-2 py-1 rounded text-sm font-mono"
          >
            {match.groups[0]}
          </code>
        )
      } else if (match.type === 'link') {
        parts.push(
          <a
            key={`${match.start}_link`}
            href={match.groups[1]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline"
          >
            {match.groups[0]}
          </a>
        )
      }

      lastIndex = match.end
    })

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts
  }

  const modelsList = Object.values(MODELS)
  const groupedModels = modelsList.reduce(
    (acc, model) => {
      const provider = model.provider || 'other'
      if (!acc[provider]) acc[provider] = []
      acc[provider].push(model)
      return acc
    },
    {} as Record<string, ModelInfo[]>
  )

  const currentModelData = MODELS[currentModel]

  return (
    <div
      className={`flex flex-col h-full ${
        mode === 'floating' ? 'bg-bg-primary' : 'bg-bg-primary'
      } border border-border-default rounded-lg overflow-hidden`}
    >
      {/* Header */}
      {mode === 'fullpage' && (
        <div className="px-4 py-3 border-b border-border-default flex items-center justify-between bg-bg-secondary">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-primary" />
            <h1 className="text-lg font-semibold text-text-fg-primary">JARVIS</h1>
          </div>
          {currentModelData && (
            <div className="flex items-center gap-2 text-sm text-text-fg-secondary">
              <Cpu className="w-4 h-4" />
              <span>{currentModelData.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Model Selector */}
      <div className="px-4 py-2 border-b border-border-default bg-bg-secondary">
        <div className="relative">
          <button
            onClick={() => setExpandedModelDropdown(!expandedModelDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 rounded bg-bg-tertiary hover:bg-bg-surface transition-colors text-text-fg-primary text-sm"
          >
            <span className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              {currentModelData?.name || 'Selecionar modelo'}
            </span>
            {expandedModelDropdown ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expandedModelDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border-default rounded shadow-lg z-10 max-h-60 overflow-y-auto">
              {/* Mix option */}
              <button
                onClick={() => {
                  setCurrentModel('mix')
                  setExpandedModelDropdown(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  currentModel === 'mix'
                    ? 'bg-accent-primary text-bg-primary font-semibold'
                    : 'text-text-fg-primary hover:bg-bg-tertiary'
                }`}
              >
                <Layers className="w-4 h-4 inline mr-2" />
                Mix (múltiplos modelos)
              </button>

              {/* Grouped models */}
              {Object.entries(groupedModels).map(([provider, models]) => (
                <div key={provider}>
                  <div className="px-3 py-2 text-xs font-semibold text-text-fg-tertiary bg-bg-tertiary">
                    {provider}
                  </div>
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setCurrentModel(model.id)
                        setExpandedModelDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        currentModel === model.id
                          ? 'bg-accent-primary text-bg-primary'
                          : 'text-text-fg-primary hover:bg-bg-tertiary'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{model.name}</span>
                        <span className="text-xs text-text-fg-tertiary">
                          {model.tier === 'fast' && '⚡'}
                          {model.tier === 'balanced' && '⚖️'}
                          {model.tier === 'powerful' && '🔥'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Bot className="w-12 h-12 text-text-fg-tertiary mb-4" />
            <h2 className="text-lg font-semibold text-text-fg-primary mb-2">
              Bem-vindo ao JARVIS
            </h2>
            <p className="text-sm text-text-fg-secondary mb-6 max-w-xs">
              Seu assistente de estudo com IA. Pergunte qualquer coisa sobre seus tópicos de estudo.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
              {SUGGESTIONS.map((sugg, idx) => {
                const Icon = sugg.icon
                return (
                  <button
                    key={idx}
                    onClick={() => sendMessage(sugg.text)}
                    className="text-left p-3 rounded bg-bg-secondary hover:bg-bg-tertiary transition-colors border border-border-default"
                  >
                    <Icon className="w-4 h-4 text-accent-primary mb-2" />
                    <p className="text-xs text-text-fg-secondary line-clamp-2">{sugg.text}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3 animate-in">
                {msg.role === 'user' ? (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center">
                    <User className="w-4 h-4 text-bg-primary" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-accent-primary" />
                  </div>
                )}

                <div className="flex-1">
                  {msg.role === 'assistant' ? (
                    <div className="space-y-3">
                      <div className="text-sm text-text-fg-primary leading-relaxed">
                        {renderMarkdown(msg.content)}
                      </div>

                      {/* Cost/Model/Duration Badge */}
                      {msg.meta && (
                        <div className="flex flex-wrap gap-2 text-xs text-fg-secondary pt-2">
                          {msg.meta.model && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-bg-tertiary rounded">
                              <Cpu className="w-3 h-3" />
                              {msg.meta.model}
                            </span>
                          )}
                          {msg.meta.durationMs && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-bg-tertiary rounded">
                              <Clock className="w-3 h-3" />
                              {msg.meta.durationMs}ms
                            </span>
                          )}
                          {msg.meta.estimatedCostUsd != null && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-bg-tertiary rounded">
                              <DollarSign className="w-3 h-3" />
                              ${msg.meta.estimatedCostUsd.toFixed(4)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tool Results */}
                      {msg.toolResults && msg.toolResults.length > 0 && (
                        <div className="space-y-2 pt-2">
                          {msg.toolResults.map((tool) => (
                            <div
                              key={tool.toolCallId}
                              className="border border-border-default rounded bg-bg-surface overflow-hidden"
                            >
                              <button
                                onClick={() => toggleToolResult(tool.toolCallId)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-bg-tertiary transition-colors text-sm text-text-fg-secondary"
                              >
                                {expandedToolResults.has(tool.toolCallId) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                                <Zap className="w-4 h-4 text-accent-primary" />
                                <span>{tool.message}</span>
                              </button>
                              {expandedToolResults.has(tool.toolCallId) && (
                                <div className="px-3 py-2 border-t border-border-default text-xs text-fg-secondary bg-bg-secondary">
                                  <pre className="whitespace-pre-wrap break-words font-mono">
                                    {JSON.stringify(tool.data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Post-Action Buttons */}
                      {msg.postActions && msg.postActions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {msg.postActions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => handleExecuteAction(action)}
                              className="text-xs px-3 py-1 rounded bg-accent-primary text-bg-primary hover:opacity-90 transition-opacity font-medium"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Mix Sources */}
                      {msg.mixSources && msg.mixSources.length > 0 && (
                        <div className="pt-2">
                          <button
                            onClick={() => toggleMixSources(msg.id)}
                            className="text-xs text-accent-primary hover:text-accent-primary/80 transition-colors flex items-center gap-1"
                          >
                            {expandedMixSources.has(msg.id) ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                            Ver contribuições dos modelos
                          </button>
                          {expandedMixSources.has(msg.id) && (
                            <div className="mt-2 space-y-1 text-xs text-text-fg-secondary">
                              {msg.mixSources.map((source) => (
                                <div key={source.model} className="pl-3 border-l border-accent-primary">
                                  <p className="font-semibold text-accent-primary">{MODELS[source.model]?.name ?? source.model}</p>
                                  <p className="text-fg-tertiary">{source.content.slice(0, 120)}...</p>
                                  <p className="text-fg-muted">{source.durationMs}ms · {source.tokensUsed} tokens</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-text-fg-primary">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent-primary" />
                </div>
                <div className="flex items-center gap-1 text-text-fg-secondary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Processando</span>
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>
                    .
                  </span>
                  <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>
                    .
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-3 p-3 rounded bg-accent-danger/10 border border-accent-danger/30">
                <X className="w-5 h-5 text-accent-danger flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-accent-danger">Erro</p>
                  <p className="text-sm text-text-fg-secondary">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-border-default bg-bg-secondary">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(inputValue)
              }
            }}
            placeholder="Digite sua pergunta... (Shift+Enter para nova linha)"
            className="flex-1 px-3 py-2 rounded bg-bg-tertiary text-text-fg-primary placeholder-text-fg-tertiary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary max-h-24"
            rows={1}
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5 text-bg-primary" />
          </button>
        </div>
      </div>
    </div>
  )
}
