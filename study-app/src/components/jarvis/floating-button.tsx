'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bot, X } from 'lucide-react'
import { JarvisChat } from './chat'
import type { ConversationRow } from '@/lib/services/conversations'

interface FloatingButtonProps {
  currentPage?: string
  disciplineId?: string
  topicId?: string
  initialMessage?: string | null
  onMessageConsumed?: () => void
}

export function FloatingButton({
  currentPage,
  disciplineId,
  topicId,
  initialMessage,
  onMessageConsumed,
}: FloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [floatingConvId, setFloatingConvId] = useState<string | null>(null)

  // Auto-open when a message is pending from JarvisProvider
  useEffect(() => {
    if (initialMessage) {
      setIsOpen(true)
      onMessageConsumed?.()
    }
  }, [initialMessage, onMessageConsumed])

  const handleConversationCreated = useCallback((conv: ConversationRow) => {
    setFloatingConvId(conv.id)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const panel = document.getElementById('jarvis-floating-panel')
      const button = document.getElementById('jarvis-floating-button')

      if (
        panel &&
        button &&
        !panel.contains(target) &&
        !button.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  return (
    <>
      {/* Floating Button */}
      <button
        id="jarvis-floating-button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            setUnreadCount(0)
          }
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent-primary hover:bg-accent-primary/90 transition-all shadow-lg flex items-center justify-center group z-40"
        aria-label="Abrir Hexxon AI"
      >
        <Bot className="w-6 h-6 text-bg-primary" />

        {/* Pulsing glow effect */}
        <span className="absolute inset-0 rounded-full bg-accent-primary opacity-0 group-hover:opacity-20 animate-pulse" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-danger text-bg-primary text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          id="jarvis-floating-panel"
          className="fixed bottom-24 right-6 w-96 h-96 rounded-lg shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 fade-in z-40"
          style={{
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <style>{`
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>

          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-secondary rounded-t-lg">
            <h2 className="font-semibold text-text-fg-primary flex items-center gap-2">
              <Bot className="w-4 h-4 text-accent-primary" />
              HEXXON AI
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-bg-tertiary rounded transition-colors"
              aria-label="Fechar Hexxon AI"
            >
              <X className="w-5 h-5 text-text-fg-secondary" />
            </button>
          </div>

          {/* Chat Container */}
          <div className="flex-1 overflow-hidden">
            <JarvisChat
              mode="floating"
              currentPage={currentPage}
              disciplineId={disciplineId}
              topicId={topicId}
              conversationId={floatingConvId}
              onConversationCreated={handleConversationCreated}
            />
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
