"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { OralQuestion } from "@/data/notes-flashcards";
import { difficultyLabels } from "@/data/notes-flashcards";

interface Props {
  questions: OralQuestion[];
}

type QuizState = "question" | "self-check" | "done";

const difficultyColors = {
  easy: "success",
  medium: "warning",
  hard: "danger",
} as const;

export function OralQuiz({ questions }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [state, setState] = useState<QuizState>("question");
  const [showModel, setShowModel] = useState(false);
  const [checkedPoints, setCheckedPoints] = useState<Set<number>>(new Set());
  const [scores, setScores] = useState<number[]>([]);

  const question = questions[currentIndex];

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-border-default bg-bg-surface p-12">
        <div className="text-center">
          <p className="text-lg text-fg-tertiary">Nenhuma pergunta oral disponível</p>
          <p className="mt-1 text-xs text-fg-muted">Gere perguntas com IA ou crie manualmente</p>
        </div>
      </div>
    );
  }

  if (state === "done") {
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return (
      <div className="rounded-md border border-border-default bg-bg-surface p-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-fg-primary">Quiz oral concluído!</h3>
          <div className="mt-4 flex items-center justify-center gap-8">
            <div>
              <span className="block text-3xl font-mono font-bold text-fg-primary">
                {(avgScore * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-fg-muted">Cobertura média</span>
            </div>
            <div>
              <span className="block text-3xl font-mono font-bold text-accent-primary">
                {questions.length}
              </span>
              <span className="text-xs text-fg-muted">Perguntas</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {scores.map((s, i) => (
              <div
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-sm text-xs font-mono ${
                  s >= 0.75
                    ? "bg-accent-success/10 text-accent-success"
                    : s >= 0.5
                    ? "bg-accent-warning/10 text-accent-warning"
                    : "bg-accent-danger/10 text-accent-danger"
                }`}
              >
                {(s * 100).toFixed(0)}
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setState("question");
              setScores([]);
              setCheckedPoints(new Set());
              setShowModel(false);
            }}
            className="mt-6 rounded-md border border-accent-primary bg-accent-primary/10 px-4 py-2 text-sm text-accent-primary hover:bg-accent-primary/20 transition-colors"
          >
            Refazer
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
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono text-fg-muted">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Question card */}
      <div className="rounded-lg border-2 border-border-default bg-bg-surface">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-2">
          <div className="flex items-center gap-2">
            <Badge variant={difficultyColors[question.difficulty]}>
              {difficultyLabels[question.difficulty]}
            </Badge>
            <Badge variant="outline">{question.disciplineName}</Badge>
            <span className="text-[10px] text-fg-muted">{question.topicName}</span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-base text-fg-primary leading-relaxed">{question.question}</p>

          {question.relatedConcepts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {question.relatedConcepts.map((c) => (
                <span key={c} className="rounded-sm bg-accent-primary/10 px-1.5 py-0.5 text-[10px] text-accent-primary">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {state === "question" && (
          <div className="border-t border-border-default p-4 text-center">
            <p className="text-xs text-fg-muted mb-3">Responda em voz alta, depois clique para auto-avaliar</p>
            <button
              onClick={() => setState("self-check")}
              className="rounded-md border border-accent-primary bg-accent-primary/10 px-6 py-2 text-sm text-accent-primary hover:bg-accent-primary/20 transition-colors"
            >
              Respondi — ver checklist
            </button>
          </div>
        )}

        {state === "self-check" && (
          <div className="border-t border-border-default p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-3">
              Marque os pontos que você cobriu:
            </p>
            <div className="space-y-2">
              {question.expectedPoints.map((point, i) => (
                <label
                  key={i}
                  className="flex items-start gap-2 rounded-sm px-2 py-1.5 hover:bg-bg-secondary transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checkedPoints.has(i)}
                    onChange={() => {
                      const next = new Set(checkedPoints);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      setCheckedPoints(next);
                    }}
                    className="mt-0.5 rounded border-border-default"
                  />
                  <span className="text-sm text-fg-secondary">{point}</span>
                </label>
              ))}
            </div>

            {/* Model answer toggle */}
            <div className="mt-4">
              <button
                onClick={() => setShowModel((s) => !s)}
                className="text-xs text-fg-muted hover:text-fg-secondary transition-colors"
              >
                {showModel ? "▾ Esconder" : "▸ Ver"} resposta modelo
              </button>
              {showModel && (
                <div className="mt-2 rounded-md bg-bg-tertiary p-3">
                  <p className="text-sm text-fg-secondary leading-relaxed">
                    {question.modelAnswer}
                  </p>
                </div>
              )}
            </div>

            {/* Score & next */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-fg-muted">
                Cobertura:{" "}
                <span className="font-mono font-semibold text-fg-primary">
                  {question.expectedPoints.length > 0
                    ? ((checkedPoints.size / question.expectedPoints.length) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </span>
              <button
                onClick={() => {
                  const score = question.expectedPoints.length > 0
                    ? checkedPoints.size / question.expectedPoints.length
                    : 0;
                  setScores([...scores, score]);
                  setCheckedPoints(new Set());
                  setShowModel(false);

                  if (currentIndex + 1 >= questions.length) {
                    setState("done");
                  } else {
                    setCurrentIndex((i) => i + 1);
                    setState("question");
                  }
                }}
                className="rounded-md border border-border-default bg-bg-tertiary px-4 py-1.5 text-sm text-fg-secondary hover:bg-bg-secondary transition-colors"
              >
                {currentIndex + 1 >= questions.length ? "Finalizar" : "Próxima →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
