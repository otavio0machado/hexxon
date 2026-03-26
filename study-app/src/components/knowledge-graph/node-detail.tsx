"use client";

import { Badge } from "@/components/ui/badge";
import { MasteryDot } from "@/components/ui/mastery-dot";
import { ScoreDisplay } from "@/components/ui/score-display";
import type { KGNode, KGEdge } from "@/data/knowledge-graph";
import { NODE_SHAPE } from "@/data/knowledge-graph";
import { getPrerequisites, getDependents, getConnected } from "@/lib/knowledge-graph";
import type { Weakness } from "@/lib/knowledge-graph";

const kindLabels: Record<string, string> = {
  concept: "Conceito",
  formula: "Fórmula",
  theorem: "Teorema",
};

const edgeKindLabels: Record<string, string> = {
  depends_on: "Dependência",
  connects: "Conexão",
  appears_in_exam: "Aparece em prova",
};

const shapeLabels: Record<string, string> = {
  circle: "●",
  diamond: "◆",
  hexagon: "⬡",
};

interface Props {
  node: KGNode;
  weakness: Weakness | undefined;
  onClose: () => void;
  onNavigate: (nodeId: string) => void;
}

export function NodeDetail({ node, weakness, onClose, onNavigate }: Props) {
  const prereqs = getPrerequisites(node.id);
  const dependents = getDependents(node.id);
  const connections = getConnected(node.id).filter((c) => c.edge.kind !== "depends_on");

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border-default p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{shapeLabels[NODE_SHAPE[node.kind]]}</span>
            <Badge variant="outline">{kindLabels[node.kind]}</Badge>
            <Badge variant={node.disciplineId === "calculo-1" ? "default" : "default"}>
              {node.disciplineId === "calculo-1" ? "Cálculo I" : "Discreta"}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="text-fg-muted hover:text-fg-secondary text-xs"
          >
            ✕
          </button>
        </div>
        <h3 className="mt-2 text-base font-semibold text-fg-primary">{node.label}</h3>
        <p className="mt-1 text-sm text-fg-secondary">{node.description}</p>
        {node.latex && (
          <code className="mt-1 block text-xs text-fg-tertiary font-mono">{node.latex}</code>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px border-b border-border-default bg-border-default">
        <div className="bg-bg-surface p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <MasteryDot level={node.mastery} size="sm" />
            <span className="text-xs text-fg-secondary capitalize">{node.mastery}</span>
          </div>
          <span className="text-[10px] text-fg-muted">Domínio</span>
        </div>
        <div className="bg-bg-surface p-3 text-center">
          <ScoreDisplay score={node.score} />
          <span className="block text-[10px] text-fg-muted">Score</span>
        </div>
        <div className="bg-bg-surface p-3 text-center">
          <span className={`text-sm font-mono ${node.errorCount > 0 ? "text-accent-danger" : "text-fg-tertiary"}`}>
            {node.errorCount}
          </span>
          <span className="block text-[10px] text-fg-muted">Erros</span>
        </div>
      </div>

      {/* Weakness alert */}
      {weakness && (
        <div className="mx-4 mt-3 rounded-md border border-accent-danger/30 bg-accent-danger/5 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs">⚠️</span>
            <Badge variant="danger">{weakness.severity}</Badge>
          </div>
          <p className="mt-1 text-xs text-fg-secondary">{weakness.reason}</p>
          {weakness.blockedNodes.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] text-fg-muted">Bloqueia:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {weakness.blockedNodes.map((bn) => (
                  <button
                    key={bn.id}
                    onClick={() => onNavigate(bn.id)}
                    className="rounded-sm bg-accent-danger/10 px-1.5 py-0.5 text-[10px] text-accent-danger hover:bg-accent-danger/20 transition-colors"
                  >
                    {bn.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Module info */}
      <div className="px-4 pt-3">
        <span className="text-[10px] text-fg-muted">Módulo:</span>
        <p className="text-xs text-fg-secondary">{node.moduleName}</p>
      </div>

      {/* Exam appearances */}
      {node.examIds.length > 0 && (
        <div className="px-4 pt-2">
          <span className="text-[10px] text-fg-muted">Provas:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {node.examIds.map((eid) => (
              <span key={eid} className="rounded-sm bg-accent-primary/10 px-1.5 py-0.5 text-[10px] text-accent-primary">
                {eid}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prerequisites */}
      <div className="px-4 pt-3">
        <h4 className="text-xs font-medium text-fg-muted">Depende de ({prereqs.length})</h4>
        <div className="mt-1 space-y-1">
          {prereqs.length === 0 ? (
            <p className="text-[10px] text-fg-tertiary">Nenhum pré-requisito</p>
          ) : (
            prereqs.map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate(p.id)}
                className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left hover:bg-bg-secondary transition-colors"
              >
                <MasteryDot level={p.mastery} size="sm" />
                <span className="flex-1 text-xs text-fg-secondary">{p.label}</span>
                <ScoreDisplay score={p.score} className="text-[10px]" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Dependents */}
      <div className="px-4 pt-3">
        <h4 className="text-xs font-medium text-fg-muted">É pré-req de ({dependents.length})</h4>
        <div className="mt-1 space-y-1">
          {dependents.length === 0 ? (
            <p className="text-[10px] text-fg-tertiary">Nenhum dependente</p>
          ) : (
            dependents.map((d) => (
              <button
                key={d.id}
                onClick={() => onNavigate(d.id)}
                className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left hover:bg-bg-secondary transition-colors"
              >
                <MasteryDot level={d.mastery} size="sm" />
                <span className="flex-1 text-xs text-fg-secondary">{d.label}</span>
                <ScoreDisplay score={d.score} className="text-[10px]" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Other connections */}
      {connections.length > 0 && (
        <div className="px-4 pt-3 pb-4">
          <h4 className="text-xs font-medium text-fg-muted">Conexões</h4>
          <div className="mt-1 space-y-1">
            {connections.map((c) => (
              <button
                key={c.node.id + c.edge.id}
                onClick={() => onNavigate(c.node.id)}
                className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left hover:bg-bg-secondary transition-colors"
              >
                <MasteryDot level={c.node.mastery} size="sm" />
                <span className="flex-1 text-xs text-fg-secondary">{c.node.label}</span>
                <span className="text-[10px] text-fg-muted">{edgeKindLabels[c.edge.kind]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
