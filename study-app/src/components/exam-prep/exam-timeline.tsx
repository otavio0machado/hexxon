"use client";

import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Assessment } from "@/data/exam-data";
import {
  daysUntil,
  formatCountdown,
  urgencyLevel,
  urgencyColor,
  urgencyBg,
  examCoverage,
  estimateExamGrade,
} from "@/lib/exam-prep";

const typeLabels: Record<string, string> = {
  prova: "Prova",
  trabalho: "Trabalho",
  ps: "Substitutiva",
  g2: "Exame G2",
};

const typeBadgeVariant: Record<string, "danger" | "warning" | "default" | "outline"> = {
  prova: "danger",
  trabalho: "warning",
  ps: "default",
  g2: "danger",
};

interface Props {
  assessments: Assessment[];
  onSelect: (exam: Assessment) => void;
  selectedId?: string;
}

export function ExamTimeline({ assessments, onSelect, selectedId }: Props) {
  return (
    <div className="space-y-2">
      {assessments.map((exam) => {
        const days = daysUntil(exam.date);
        const level = urgencyLevel(days);
        const coverage = examCoverage(exam);
        const estimated = estimateExamGrade(exam);
        const isSelected = exam.id === selectedId;

        return (
          <button
            key={exam.id}
            onClick={() => onSelect(exam)}
            className={`w-full rounded-md border p-3 text-left transition-all ${
              isSelected
                ? "border-accent-primary bg-accent-primary/5 ring-1 ring-accent-primary/20"
                : `${urgencyBg(level)} hover:border-border-hover`
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={typeBadgeVariant[exam.type]}>{typeLabels[exam.type]}</Badge>
                <span className="text-sm font-medium text-fg-primary">{exam.name}</span>
                <span className="text-xs text-fg-tertiary">· {exam.disciplineName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs font-semibold ${urgencyColor(level)}`}>
                  {formatCountdown(days)}
                </span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-4">
              <div className="flex-1">
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-[10px] text-fg-muted">Cobertura</span>
                  <span className="font-mono text-[10px] text-fg-tertiary">{coverage.coveragePct}%</span>
                </div>
                <ProgressBar value={coverage.coveragePct} variant="thin" />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-fg-muted">Est.</span>
                <span className={`ml-1 font-mono text-xs font-semibold ${estimated >= 6 ? "text-accent-success" : estimated >= 4 ? "text-accent-warning" : "text-accent-danger"}`}>
                  {estimated.toFixed(1)}
                </span>
              </div>
              <div className="flex gap-1 text-[10px]">
                <span className="text-mastery-proficient">●{coverage.mastered}</span>
                <span className="text-mastery-developing">●{coverage.developing}</span>
                <span className="text-mastery-exposed">●{coverage.weak}</span>
                <span className="text-mastery-none">●{coverage.unseen}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
