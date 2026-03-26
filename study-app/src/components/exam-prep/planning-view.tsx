"use client";

import { useState } from "react";
import { MasteryDot } from "@/components/ui/mastery-dot";
import { ScoreDisplay } from "@/components/ui/score-display";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import type { Assessment } from "@/data/exam-data";
import {
  daysUntil,
  formatCountdown,
  urgencyLevel,
  urgencyColor,
  examCoverage,
  estimateExamGrade,
  prioritizeTopics,
  neededForApproval,
} from "@/lib/exam-prep";

interface Props {
  exam: Assessment;
  onStartSimulation: () => void;
  onRequestAIPlan: () => void;
}

export function PlanningView({ exam, onStartSimulation, onRequestAIPlan }: Props) {
  const [showAllTopics, setShowAllTopics] = useState(false);
  const days = daysUntil(exam.date);
  const level = urgencyLevel(days);
  const coverage = examCoverage(exam);
  const estimated = estimateExamGrade(exam);
  const prioritized = prioritizeTopics(exam.topics, days);
  const topicsToShow = showAllTopics ? prioritized : prioritized.slice(0, 6);
  const needed = neededForApproval({}, 7.0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg-primary">{exam.name}</h2>
          <p className="text-xs text-fg-tertiary">{exam.disciplineName} · {new Date(exam.date).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-mono font-bold ${urgencyColor(level)}`}>
            {formatCountdown(days)}
          </span>
          <p className="text-[10px] text-fg-muted uppercase tracking-wider">para a prova</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-md border border-border-default bg-bg-surface p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">Cobertura</span>
          <p className="mt-1 font-mono text-xl font-bold text-fg-primary">{coverage.coveragePct}%</p>
          <ProgressBar value={coverage.coveragePct} />
        </div>
        <div className="rounded-md border border-border-default bg-bg-surface p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">Nota estimada</span>
          <p className={`mt-1 font-mono text-xl font-bold ${estimated >= 6 ? "text-accent-success" : "text-accent-danger"}`}>
            {estimated.toFixed(1)}
          </p>
          <span className="text-[10px] text-fg-muted">de 10.0</span>
        </div>
        <div className="rounded-md border border-border-default bg-bg-surface p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">Tópicos</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-fg-primary">{exam.topics.length}</span>
          </div>
          <div className="flex gap-1 text-[10px]">
            <span className="text-mastery-proficient">{coverage.mastered} ok</span>
            <span className="text-fg-muted">·</span>
            <span className="text-accent-danger">{coverage.unseen} novos</span>
          </div>
        </div>
        <div className="rounded-md border border-border-default bg-bg-surface p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">Score médio</span>
          <p className="mt-1 font-mono text-xl font-bold text-fg-primary">{coverage.avgScore.toFixed(2)}</p>
          <span className="text-[10px] text-fg-muted">dos tópicos</span>
        </div>
      </div>

      {/* Priority topics */}
      <div className="rounded-md border border-border-default bg-bg-surface">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Tópicos por prioridade
          </h3>
          <span className="text-[10px] text-fg-muted">maior prioridade = estudar primeiro</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {topicsToShow.map((topic, i) => (
            <div key={topic.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 font-mono text-xs text-fg-muted">{i + 1}</span>
              <MasteryDot level={topic.mastery} size="sm" />
              <span className="flex-1 text-sm text-fg-secondary">{topic.name}</span>
              <span className="text-xs text-fg-tertiary">{topic.moduleName}</span>
              <ScoreDisplay score={topic.score} className="text-xs" />
              <div className="w-16">
                <ProgressBar value={topic.priority ?? 0} />
              </div>
              <Badge variant={
                (topic.priority ?? 0) >= 70 ? "danger" :
                (topic.priority ?? 0) >= 40 ? "warning" : "default"
              }>
                {topic.priority}
              </Badge>
            </div>
          ))}
        </div>
        {prioritized.length > 6 && (
          <button
            onClick={() => setShowAllTopics(!showAllTopics)}
            className="w-full border-t border-border-default px-4 py-2 text-xs text-accent-primary hover:bg-bg-secondary transition-colors"
          >
            {showAllTopics ? "Mostrar menos" : `Ver todos os ${prioritized.length} tópicos`}
          </button>
        )}
      </div>

      {/* G1 projection */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-fg-muted">
          Projeção G1
        </h3>
        <p className="text-sm text-fg-secondary">{needed.message}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRequestAIPlan}
          className="flex-1 rounded-md border border-accent-primary bg-accent-primary/10 px-4 py-2.5 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/20"
        >
          Gerar plano de estudo com IA
        </button>
        <button
          onClick={onStartSimulation}
          className="rounded-md border border-border-default px-4 py-2.5 text-sm font-medium text-fg-secondary transition-colors hover:bg-bg-secondary"
        >
          Iniciar simulado
        </button>
      </div>
    </div>
  );
}
