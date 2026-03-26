"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Assessment } from "@/data/exam-data";
import {
  daysUntil,
  hoursUntil,
  urgencyLevel,
  urgencyColor,
  generateFinalReviewChecklist,
  type ReviewCheckItem,
} from "@/lib/exam-prep";

interface Props {
  exam: Assessment;
  onStartSimulation: () => void;
}

const priorityOrder = { critical: 0, high: 1, medium: 2 };

export function FinalReviewView({ exam, onStartSimulation }: Props) {
  const [checklist, setChecklist] = useState<ReviewCheckItem[]>(() =>
    generateFinalReviewChecklist(exam)
  );

  const hours = Math.max(0, Math.round(hoursUntil(exam.date)));
  const days = daysUntil(exam.date);
  const level = urgencyLevel(days);
  const completedCount = checklist.filter((c) => c.checked).length;
  const totalCount = checklist.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggle = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const sorted = [...checklist].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className="space-y-4">
      {/* Alert header */}
      <div className="rounded-md border border-accent-danger/30 bg-accent-danger/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fg-primary">
              Revisão Final — {exam.name}
            </h2>
            <p className="text-xs text-fg-tertiary">{exam.disciplineName}</p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-mono font-bold ${urgencyColor(level)}`}>
              {hours}h
            </span>
            <p className="text-[10px] text-fg-muted uppercase tracking-wider">restantes</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-2 rounded-full bg-bg-tertiary">
            <div
              className="h-full rounded-full bg-accent-success transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="font-mono text-xs text-fg-tertiary">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Strategy note */}
      <div className="rounded-md border border-border-default bg-bg-surface p-3">
        <p className="text-xs text-fg-secondary">
          <strong className="text-fg-primary">Estratégia:</strong> Foco nos itens críticos primeiro.
          Não tente aprender tópico novo agora — reforce o que já viu. Revise fórmulas e procedimentos.
          Se sobrar tempo, faça um simulado rápido.
        </p>
      </div>

      {/* Checklist */}
      <div className="rounded-md border border-border-default bg-bg-surface">
        <div className="border-b border-border-default px-4 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Checklist de revisão
          </h3>
        </div>
        <div className="divide-y divide-border-subtle">
          {sorted.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-secondary"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggle(item.id)}
                className="h-4 w-4 rounded border-border-default accent-accent-primary"
              />
              <span
                className={`flex-1 text-sm ${
                  item.checked ? "text-fg-muted line-through" : "text-fg-secondary"
                }`}
              >
                {item.label}
              </span>
              <Badge
                variant={
                  item.priority === "critical" ? "danger" :
                  item.priority === "high" ? "warning" : "default"
                }
              >
                {item.priority}
              </Badge>
            </label>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <button
          onClick={onStartSimulation}
          className="flex-1 rounded-md border border-accent-primary bg-accent-primary/10 px-4 py-2.5 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/20"
        >
          Simulado rápido (30min)
        </button>
      </div>
    </div>
  );
}
