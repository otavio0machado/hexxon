"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import type { StudyFlashcard } from "@/data/notes-flashcards";
import { cardTypeLabels } from "@/data/notes-flashcards";
import { getNextReviewDays } from "@/lib/notes-flashcards";

interface Props {
  cards: StudyFlashcard[];
  onComplete: (results: { cardId: string; correct: boolean }[]) => void;
}

export function FlashcardDeck({ cards, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<{ cardId: string; correct: boolean }[]>([]);
  const [finished, setFinished] = useState(false);

  const card = cards[currentIndex];

  const handleAnswer = useCallback(
    (correct: boolean) => {
      const newResults = [...results, { cardId: card.id, correct }];
      setResults(newResults);
      setFlipped(false);

      if (currentIndex + 1 >= cards.length) {
        setFinished(true);
        onComplete(newResults);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    },
    [card, currentIndex, cards.length, results, onComplete]
  );

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-border-default bg-bg-surface p-12">
        <div className="text-center">
          <p className="text-lg text-fg-tertiary">Nenhum flashcard disponível</p>
          <p className="mt-1 text-xs text-fg-muted">Gere flashcards com IA ou crie manualmente</p>
        </div>
      </div>
    );
  }

  if (finished) {
    const correct = results.filter((r) => r.correct).length;
    const accuracy = results.length > 0 ? correct / results.length : 0;

    return (
      <div className="rounded-md border border-border-default bg-bg-surface p-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-fg-primary">Sessão completa!</h3>
          <div className="mt-4 flex items-center justify-center gap-8">
            <div>
              <span className="block text-3xl font-mono font-bold text-accent-success">{correct}</span>
              <span className="text-xs text-fg-muted">Corretos</span>
            </div>
            <div>
              <span className="block text-3xl font-mono font-bold text-accent-danger">{results.length - correct}</span>
              <span className="text-xs text-fg-muted">Errados</span>
            </div>
            <div>
              <span className="block text-3xl font-mono font-bold text-fg-primary">
                {(accuracy * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-fg-muted">Precisão</span>
            </div>
          </div>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setFlipped(false);
              setResults([]);
              setFinished(false);
            }}
            className="mt-6 rounded-md border border-accent-primary bg-accent-primary/10 px-4 py-2 text-sm text-accent-primary hover:bg-accent-primary/20 transition-colors"
          >
            Revisar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-primary transition-all"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono text-fg-muted">
          {currentIndex + 1}/{cards.length}
        </span>
      </div>

      {/* Card */}
      <div
        className="relative cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className={`rounded-lg border-2 transition-all duration-300 ${
            flipped
              ? "border-accent-primary bg-bg-surface"
              : "border-border-default bg-bg-surface hover:border-border-hover"
          }`}
          style={{ minHeight: 240 }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-border-default px-4 py-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{cardTypeLabels[card.type]}</Badge>
              <Badge variant="default">{card.disciplineName}</Badge>
              <span className="text-[10px] text-fg-muted">{card.topicName}</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${i < card.difficulty ? "text-accent-warning" : "text-fg-muted/30"}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Card content */}
          <div className="flex items-center justify-center p-8">
            <div className="text-center max-w-lg">
              {!flipped ? (
                <div>
                  <p className="text-sm text-fg-primary leading-relaxed">{card.front}</p>
                  <p className="mt-4 text-[10px] text-fg-muted">Clique para ver a resposta</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-fg-muted mb-2">Resposta:</p>
                  <p className="text-sm text-fg-primary leading-relaxed whitespace-pre-wrap">{card.back}</p>
                </div>
              )}
            </div>
          </div>

          {/* SR info */}
          <div className="flex items-center justify-between border-t border-border-default px-4 py-2 text-[10px] text-fg-muted">
            <span>Box {card.srBox}/4</span>
            <span>
              Acerto: {card.timesReviewed > 0 ? ((card.timesCorrect / card.timesReviewed) * 100).toFixed(0) : "—"}%
            </span>
            <span>Próxima: {card.nextReview}</span>
          </div>
        </div>
      </div>

      {/* Answer buttons */}
      {flipped && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleAnswer(false)}
            className="flex items-center gap-2 rounded-md border border-accent-danger/30 bg-accent-danger/5 px-6 py-2.5 text-sm text-accent-danger hover:bg-accent-danger/10 transition-colors"
          >
            <span>✕</span>
            <span>Errei</span>
            <span className="text-[10px] opacity-60">→ box 0</span>
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex items-center gap-2 rounded-md border border-accent-success/30 bg-accent-success/5 px-6 py-2.5 text-sm text-accent-success hover:bg-accent-success/10 transition-colors"
          >
            <span>✓</span>
            <span>Acertei</span>
            <span className="text-[10px] opacity-60">→ box {Math.min(card.srBox + 1, 4)} ({getNextReviewDays(card.srBox + 1)}d)</span>
          </button>
        </div>
      )}
    </div>
  );
}
