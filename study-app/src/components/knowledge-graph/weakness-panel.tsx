"use client";

import { Badge } from "@/components/ui/badge";
import { MasteryDot } from "@/components/ui/mastery-dot";
import type { Weakness } from "@/lib/knowledge-graph";

interface Props {
  weaknesses: Weakness[];
  onNavigate: (nodeId: string) => void;
}

const severityColors = {
  critical: "text-accent-danger",
  high: "text-accent-warning",
  medium: "text-fg-tertiary",
};

export function WeaknessPanel({ weaknesses, onNavigate }: Props) {
  if (weaknesses.length === 0) {
    return (
      <div className="rounded-md border border-accent-success/30 bg-accent-success/5 p-4 text-center">
        <p className="text-sm text-accent-success">Nenhuma fraqueza crítica detectada</p>
        <p className="mt-1 text-xs text-fg-tertiary">Continue estudando para manter o progresso!</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border-default bg-bg-surface">
      <div className="border-b border-border-default px-4 py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Fraquezas Detectadas
          </h3>
          <Badge variant="danger">{weaknesses.length}</Badge>
        </div>
      </div>
      <div className="divide-y divide-border-subtle">
        {weaknesses.map((w, i) => (
          <button
            key={w.node.id + i}
            onClick={() => onNavigate(w.node.id)}
            className="w-full px-4 py-3 text-left transition-colors hover:bg-bg-secondary"
          >
            <div className="flex items-center gap-2">
              <MasteryDot level={w.node.mastery} size="sm" />
              <span className="flex-1 text-sm font-medium text-fg-primary">{w.node.label}</span>
              <Badge variant={w.severity === "critical" ? "danger" : w.severity === "high" ? "warning" : "default"}>
                {w.severity}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-fg-tertiary">{w.reason}</p>
            {w.blockedNodes.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {w.blockedNodes.slice(0, 3).map((bn) => (
                  <span key={bn.id} className="rounded-sm bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-fg-muted">
                    → {bn.label}
                  </span>
                ))}
                {w.blockedNodes.length > 3 && (
                  <span className="text-[10px] text-fg-muted">+{w.blockedNodes.length - 3}</span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
