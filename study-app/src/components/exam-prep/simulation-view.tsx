"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import type { Assessment, SimulationQuestion } from "@/data/exam-data";
import { estimateSimulationTime } from "@/lib/exam-prep";

// Mock questions — em produção, vêm da API /api/ai/exercises
function generateMockQuestions(exam: Assessment): SimulationQuestion[] {
  return exam.topics.slice(0, 8).map((t, i) => ({
    id: `sim-q${i + 1}`,
    topicId: t.id,
    topicName: t.name,
    statement: `[Q${i + 1}] Sobre "${t.name}": resolva o exercício abaixo.\n\n(Este é um placeholder — em produção, o exercício é gerado por IA via /api/ai/exercises com base no tópico e nível de mastery.)`,
    type: i % 3 === 0 ? "multiple-choice" : i % 3 === 1 ? "computation" : "open-ended",
    options: i % 3 === 0 ? [
      { label: "A", text: "Opção gerada pela IA", isCorrect: false },
      { label: "B", text: "Opção gerada pela IA", isCorrect: true },
      { label: "C", text: "Opção gerada pela IA", isCorrect: false },
      { label: "D", text: "Opção gerada pela IA", isCorrect: false },
    ] : undefined,
    solution: "Solução completa gerada por IA.",
    hints: ["Dica 1: pense no conceito base.", "Dica 2: aplique a definição.", "Dica 3: verifique com exemplo."],
    difficulty: Math.min(5, Math.max(1, Math.round(3 + (1 - t.score) * 2))) as 1 | 2 | 3 | 4 | 5,
    timeEstimateMin: 8 + i,
  }));
}

interface Props {
  exam: Assessment;
  onFinish: (results: { correct: number; total: number; timeUsedSec: number; answers: Record<string, string> }) => void;
  onCancel: () => void;
}

export function SimulationView({ exam, onFinish, onCancel }: Props) {
  const [questions] = useState(() => generateMockQuestions(exam));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const timeLimitSec = estimateSimulationTime(exam) * 60;
  const [elapsedSec, setElapsedSec] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    const interval = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [finished]);

  const current = questions[currentIdx];
  const answered = Object.keys(answers).length;
  const remaining = Math.max(0, timeLimitSec - elapsedSec);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };

  const finishSim = useCallback(() => {
    setFinished(true);
    let correct = 0;
    questions.forEach((q) => {
      if (q.type === "multiple-choice" && q.options) {
        const correctOpt = q.options.find((o) => o.isCorrect);
        if (correctOpt && answers[q.id] === correctOpt.label) correct++;
      }
    });
    onFinish({ correct, total: questions.length, timeUsedSec: elapsedSec, answers });
  }, [questions, answers, elapsedSec, onFinish]);

  // Auto-finish on time up
  useEffect(() => {
    if (remaining <= 0 && !finished) finishSim();
  }, [remaining, finished, finishSim]);

  if (!current) return null;

  return (
    <div className="space-y-4">
      {/* Timer bar */}
      <div className="flex items-center justify-between rounded-md border border-border-default bg-bg-surface px-4 py-2">
        <div className="flex items-center gap-3">
          <Badge variant="danger">Simulado</Badge>
          <span className="text-sm font-medium text-fg-primary">{exam.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-fg-tertiary">
            {answered}/{questions.length} respondidas
          </span>
          <span className={`font-mono text-sm font-bold ${remaining < 300 ? "text-accent-danger" : "text-fg-primary"}`}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => { setCurrentIdx(i); setShowHint(0); setShowSolution(false); }}
            className={`h-2 flex-1 rounded-full transition-colors ${
              i === currentIdx
                ? "bg-accent-primary"
                : answers[q.id]
                ? "bg-accent-success"
                : "bg-bg-tertiary"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-fg-muted">Q{currentIdx + 1}/{questions.length}</span>
            <Badge variant="outline">{current.topicName}</Badge>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: current.difficulty }).map((_, i) => (
              <span key={i} className="text-[8px] text-accent-warning">★</span>
            ))}
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm text-fg-primary leading-relaxed">
          {current.statement}
        </p>

        {/* Options for MC */}
        {current.type === "multiple-choice" && current.options && (
          <div className="mt-4 space-y-2">
            {current.options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleAnswer(opt.label)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  answers[current.id] === opt.label
                    ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                    : "border-border-default text-fg-secondary hover:border-border-hover"
                }`}
              >
                <span className="mr-2 font-mono font-semibold">{opt.label}.</span>
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {/* Text input for open/computation */}
        {current.type !== "multiple-choice" && (
          <textarea
            value={answers[current.id] ?? ""}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="Sua resposta..."
            rows={4}
            className="mt-4 w-full rounded-md border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-primary/50 outline-none"
          />
        )}

        {/* Hints */}
        <div className="mt-3 flex items-center gap-2">
          {showHint < current.hints.length && (
            <button
              onClick={() => setShowHint(showHint + 1)}
              className="text-xs text-accent-primary hover:underline"
            >
              Pedir dica ({showHint + 1}/{current.hints.length})
            </button>
          )}
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="text-xs text-fg-tertiary hover:text-fg-secondary"
          >
            {showSolution ? "Ocultar solução" : "Ver solução"}
          </button>
        </div>

        {showHint > 0 && (
          <div className="mt-2 space-y-1">
            {current.hints.slice(0, showHint).map((h, i) => (
              <p key={i} className="text-xs text-mastery-exposed">💡 {h}</p>
            ))}
          </div>
        )}

        {showSolution && (
          <div className="mt-2 rounded-md border border-accent-success/30 bg-accent-success/5 p-3">
            <p className="text-xs font-medium text-accent-success">Solução:</p>
            <p className="mt-1 text-xs text-fg-secondary">{current.solution}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { setCurrentIdx(Math.max(0, currentIdx - 1)); setShowHint(0); setShowSolution(false); }}
          disabled={currentIdx === 0}
          className="rounded-md border border-border-default px-4 py-2 text-sm text-fg-tertiary transition-colors hover:text-fg-secondary disabled:opacity-30"
        >
          ← Anterior
        </button>
        <button
          onClick={onCancel}
          className="text-xs text-fg-muted hover:text-fg-tertiary"
        >
          Abandonar simulado
        </button>
        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => { setCurrentIdx(currentIdx + 1); setShowHint(0); setShowSolution(false); }}
            className="rounded-md border border-accent-primary bg-accent-primary/10 px-4 py-2 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/20"
          >
            Próxima →
          </button>
        ) : (
          <button
            onClick={finishSim}
            className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-primary/90"
          >
            Finalizar simulado
          </button>
        )}
      </div>
    </div>
  );
}
