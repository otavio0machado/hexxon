"use client";

import { Badge } from "@/components/ui/badge";
import { MasteryDot } from "@/components/ui/mastery-dot";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Assessment } from "@/data/exam-data";
import { mockSimulationResults } from "@/data/exam-data";
import { examCoverage } from "@/lib/exam-prep";

const errorClassLabels: Record<string, string> = {
  conceptual: "Conceitual",
  procedural: "Procedimental",
  algebraic: "Algébrico",
  prerequisite: "Pré-requisito",
  reading: "Leitura",
};

const errorClassColors: Record<string, string> = {
  conceptual: "text-accent-danger",
  procedural: "text-accent-warning",
  algebraic: "text-mastery-exposed",
  prerequisite: "text-mastery-developing",
  reading: "text-fg-tertiary",
};

interface NormalizedResult {
  score: number;
  correct: number;
  total: number;
  timeUsedMin: number;
  timeLimitMin: number;
  byTopic: { topicId: string; topicName: string; correct: number; total: number; score: number }[];
  errors: { questionId: string; topicId: string; errorClass: string; explanation: string }[];
}

interface Props {
  exam: Assessment;
  simulationResult?: { correct: number; total: number; timeUsedSec: number };
  onBackToPlanning: () => void;
}

export function PostExamView({ exam, simulationResult, onBackToPlanning }: Props) {
  // Normalize to a single shape
  let result: NormalizedResult | null = null;

  if (simulationResult) {
    result = {
      score: Math.round((simulationResult.correct / simulationResult.total) * 100) / 10,
      correct: simulationResult.correct,
      total: simulationResult.total,
      timeUsedMin: Math.round(simulationResult.timeUsedSec / 60),
      timeLimitMin: 90,
      byTopic: exam.topics.slice(0, Math.min(exam.topics.length, simulationResult.total)).map((t, i) => ({
        topicId: t.id,
        topicName: t.name,
        correct: i < simulationResult.correct ? 1 : 0,
        total: 1,
        score: i < simulationResult.correct ? 10 : 0,
      })),
      errors: [],
    };
  } else if (mockSimulationResults[0]) {
    const mock = mockSimulationResults[0];
    result = {
      score: mock.score,
      correct: mock.correct,
      total: mock.totalQuestions,
      timeUsedMin: mock.timeUsedMin,
      timeLimitMin: mock.timeLimitMin,
      byTopic: mock.byTopic,
      errors: mock.errors,
    };
  }

  const coverage = examCoverage(exam);

  if (!result) {
    return (
      <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
        <p className="text-sm text-fg-tertiary">Nenhum resultado disponível para esta avaliação.</p>
        <button onClick={onBackToPlanning} className="mt-4 text-xs text-accent-primary hover:underline">
          Voltar ao planejamento
        </button>
      </div>
    );
  }

  const scorePct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const passed = result.score >= 6.0;

  // Count error types
  const errorCounts: Record<string, number> = {};
  result.errors.forEach((e) => {
    errorCounts[e.errorClass] = (errorCounts[e.errorClass] ?? 0) + 1;
  });

  return (
    <div className="space-y-4">
      {/* Result header */}
      <div className={`rounded-md border p-4 ${passed ? "border-accent-success/30 bg-accent-success/5" : "border-accent-danger/30 bg-accent-danger/5"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg-primary">
              {simulationResult ? "Resultado do Simulado" : "Análise Pós-Prova"} — {exam.name}
            </h2>
            <p className="text-xs text-fg-tertiary">{exam.disciplineName}</p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-mono font-bold ${passed ? "text-accent-success" : "text-accent-danger"}`}>
              {result.score.toFixed(1)}
            </span>
            <p className="text-[10px] text-fg-muted">{result.correct}/{result.total} questões</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border-default bg-bg-surface p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">Acerto</span>
          <p className="mt-1 font-mono text-xl font-bold text-fg-primary">{scorePct}%</p>
          <ProgressBar value={scorePct} />
        </div>
        <div className="rounded-md border border-border-default bg-bg-surface p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">Tempo</span>
          <p className="mt-1 font-mono text-xl font-bold text-fg-primary">{result.timeUsedMin}min</p>
          <span className="text-[10px] text-fg-muted">de {result.timeLimitMin}min</span>
        </div>
        <div className="rounded-md border border-border-default bg-bg-surface p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">Erros</span>
          <p className="mt-1 font-mono text-xl font-bold text-fg-primary">{result.errors.length}</p>
          <span className="text-[10px] text-fg-muted">classificados</span>
        </div>
      </div>

      {/* Performance by topic */}
      <div className="rounded-md border border-border-default bg-bg-surface">
        <div className="border-b border-border-default px-4 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Desempenho por tópico
          </h3>
        </div>
        <div className="divide-y divide-border-subtle">
          {result.byTopic.map((tp) => {
            const topicData = exam.topics.find((t) => t.id === tp.topicId);
            const tpPct = tp.total > 0 ? Math.round((tp.correct / tp.total) * 100) : 0;
            return (
              <div key={tp.topicId} className="flex items-center gap-3 px-4 py-2.5">
                {topicData && <MasteryDot level={topicData.mastery} size="sm" />}
                <span className="flex-1 text-sm text-fg-secondary">{tp.topicName}</span>
                <span className="font-mono text-xs text-fg-tertiary">
                  {tp.correct}/{tp.total}
                </span>
                <div className="w-20">
                  <ProgressBar value={tpPct} />
                </div>
                <span className={`font-mono text-xs font-semibold ${tpPct >= 70 ? "text-accent-success" : tpPct >= 40 ? "text-accent-warning" : "text-accent-danger"}`}>
                  {tp.score.toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error analysis */}
      {result.errors.length > 0 && (
        <div className="rounded-md border border-border-default bg-bg-surface">
          <div className="border-b border-border-default px-4 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
              Análise de erros
            </h3>
          </div>
          {/* Error type distribution */}
          <div className="flex gap-3 border-b border-border-subtle px-4 py-3">
            {Object.entries(errorCounts).map(([cls, count]) => (
              <div key={cls} className="flex items-center gap-1">
                <span className={`text-sm font-semibold ${errorClassColors[cls]}`}>{count}</span>
                <span className="text-xs text-fg-tertiary">{errorClassLabels[cls]}</span>
              </div>
            ))}
          </div>
          {/* Individual errors */}
          <div className="divide-y divide-border-subtle">
            {result.errors.map((err, i) => (
              <div key={i} className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Badge variant={err.errorClass === "conceptual" ? "danger" : "warning"}>
                    {errorClassLabels[err.errorClass]}
                  </Badge>
                  <span className="text-xs text-fg-tertiary">
                    {exam.topics.find((t) => t.id === err.topicId)?.name}
                  </span>
                </div>
                <p className="mt-1 text-xs text-fg-secondary">{err.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-fg-muted">
          Próximos passos
        </h3>
        <ul className="space-y-1.5 text-sm text-fg-secondary">
          {coverage.unseen > 0 && (
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-accent-danger">▸</span>
              Estudar os {coverage.unseen} tópicos ainda não vistos
            </li>
          )}
          {Object.entries(errorCounts).filter(([cls]) => cls === "conceptual").map(([, count]) => (
            <li key="conceptual" className="flex items-start gap-2">
              <span className="mt-0.5 text-accent-danger">▸</span>
              Revisar conceitos base — {count} erros conceituais detectados
            </li>
          ))}
          {Object.entries(errorCounts).filter(([cls]) => cls === "procedural").map(([, count]) => (
            <li key="procedural" className="flex items-start gap-2">
              <span className="mt-0.5 text-accent-warning">▸</span>
              Praticar mais exercícios — {count} erros procedurais
            </li>
          ))}
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-accent-primary">▸</span>
            {passed ? "Manter ritmo para consolidar resultado" : "Intensificar estudo para a próxima avaliação"}
          </li>
        </ul>
      </div>

      <button
        onClick={onBackToPlanning}
        className="w-full rounded-md border border-border-default px-4 py-2.5 text-sm font-medium text-fg-secondary transition-colors hover:bg-bg-secondary"
      >
        Voltar ao planejamento
      </button>
    </div>
  );
}
