'use client'

import { useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  Plus,
  MessageSquare,
  StickyNote,
  Layers,
  Dumbbell,
  Brain,
  BarChart3,
  Trash2,
  Sparkles,
  DollarSign,
} from 'lucide-react'
import { JarvisChat } from '@/components/jarvis/chat'

interface Conversation {
  id: string
  title: string
  timestamp: number
}

export default function JarvisPage() {
  const pathname = usePathname()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [totalCost, setTotalCost] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)

  const createNewConversation = (title: string) => {
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      title,
      timestamp: Date.now(),
    }
    setConversations((prev) => [newConv, ...prev])
    setActiveConversation(newConv.id)
  }

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id))
    if (activeConversation === id) {
      setActiveConversation(null)
    }
  }

  const quickActions = [
    {
      icon: StickyNote,
      label: 'Criar nota',
      action: () =>
        createNewConversation('Criar nota sobre tópico de estudo'),
    },
    {
      icon: Layers,
      label: 'Gerar flashcards',
      action: () => createNewConversation('Gerar flashcards'),
    },
    {
      icon: Dumbbell,
      label: 'Plano de estudo',
      action: () =>
        createNewConversation('Criar plano de estudo para prova'),
    },
    {
      icon: Brain,
      label: 'Revisar flashcards',
      action: () => createNewConversation('Flashcards para revisar'),
    },
    {
      icon: BarChart3,
      label: 'Diagnóstico',
      action: () =>
        createNewConversation('Analisar erros e sugerir melhorias'),
    },
  ]

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Sidebar */}
      <div className="w-60 border-r border-border-default flex flex-col bg-bg-secondary">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border-default">
          <button
            onClick={() => createNewConversation('Nova conversa')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-accent-primary hover:bg-accent-primary/90 transition-colors text-bg-primary font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova conversa
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-4 border-b border-border-default space-y-2">
          <h3 className="text-xs font-semibold text-text-fg-tertiary uppercase tracking-wider mb-3">
            Ações rápidas
          </h3>
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={action.action}
                className="w-full flex items-center gap-2 px-3 py-2 rounded bg-bg-tertiary hover:bg-bg-surface transition-colors text-text-fg-secondary hover:text-text-fg-primary text-xs font-medium"
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            )
          })}
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-text-fg-tertiary mx-auto mb-2" />
              <p className="text-xs text-text-fg-tertiary">
                Nenhuma conversa ainda
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-xs font-semibold text-text-fg-tertiary uppercase tracking-wider mb-3">
                Histórico
              </h3>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-2 rounded transition-colors group relative ${
                    activeConversation === conv.id
                      ? 'bg-accent-primary text-bg-primary'
                      : 'bg-bg-tertiary hover:bg-bg-surface text-text-fg-secondary hover:text-text-fg-primary'
                  }`}
                >
                  <button
                    onClick={() => setActiveConversation(conv.id)}
                    className="w-full text-left text-xs font-medium truncate pr-6"
                  >
                    {conv.title}
                  </button>
                  <button
                    onClick={() => deleteConversation(conv.id)}
                    className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Cost Tracker */}
        <div className="px-4 py-3 border-t border-border-default">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-fg-tertiary">Custo total:</span>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-accent-primary" />
              <span className="text-sm font-semibold text-text-fg-primary">
                {totalCost.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default bg-bg-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-accent-primary" />
              <h1 className="text-2xl font-bold text-text-fg-primary">JARVIS</h1>
            </div>
            <div className="flex items-center gap-4">
              {totalCost > 0 && (
                <div className="flex items-center gap-2 text-sm text-text-fg-secondary">
                  <DollarSign className="w-4 h-4" />
                  <span>Gastos nesta sessão: ${totalCost.toFixed(4)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div ref={chatRef} className="flex-1 overflow-hidden">
          <JarvisChat mode="fullpage" currentPage={pathname} />
        </div>
      </div>
    </div>
  )
}
