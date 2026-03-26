"use client";

import { MASTERY_FILL, EDGE_STYLE } from "@/data/knowledge-graph";

const masteryItems = [
  { level: "none", label: "Nenhum" },
  { level: "exposed", label: "Exposto" },
  { level: "developing", label: "Desenvolvendo" },
  { level: "proficient", label: "Proficiente" },
  { level: "mastered", label: "Dominado" },
] as const;

const shapeItems = [
  { shape: "●", label: "Conceito" },
  { shape: "◆", label: "Fórmula" },
  { shape: "⬡", label: "Teorema" },
];

const edgeItems = [
  { kind: "depends_on" as const, label: "Dependência" },
  { kind: "connects" as const, label: "Conexão" },
  { kind: "appears_in_exam" as const, label: "Aparece em prova" },
];

export function GraphLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-md border border-border-default bg-bg-surface px-4 py-2 text-[10px] text-fg-tertiary">
      {/* Mastery colors */}
      <span className="font-semibold text-fg-muted uppercase tracking-widest">Domínio:</span>
      {masteryItems.map((m) => (
        <span key={m.level} className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: MASTERY_FILL[m.level] }}
          />
          {m.label}
        </span>
      ))}

      <span className="mx-1 text-border-default">|</span>

      {/* Shapes */}
      <span className="font-semibold text-fg-muted uppercase tracking-widest">Forma:</span>
      {shapeItems.map((s) => (
        <span key={s.shape} className="flex items-center gap-1">
          <span className="text-fg-muted">{s.shape}</span>
          {s.label}
        </span>
      ))}

      <span className="mx-1 text-border-default">|</span>

      {/* Edges */}
      <span className="font-semibold text-fg-muted uppercase tracking-widest">Aresta:</span>
      {edgeItems.map((e) => {
        const style = EDGE_STYLE[e.kind];
        return (
          <span key={e.kind} className="flex items-center gap-1">
            <svg width="20" height="8" className="inline-block">
              <line
                x1={0} y1={4} x2={20} y2={4}
                stroke={style.color}
                strokeWidth={style.width}
                strokeDasharray={style.dash}
              />
            </svg>
            {e.label}
          </span>
        );
      })}

      <span className="mx-1 text-border-default">|</span>

      {/* Error indicator */}
      <span className="flex items-center gap-1">
        <svg width="14" height="14" className="inline-block">
          <circle cx={7} cy={7} r={5} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2" />
        </svg>
        Erros registrados
      </span>
    </div>
  );
}
