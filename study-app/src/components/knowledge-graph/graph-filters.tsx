"use client";

import { Badge } from "@/components/ui/badge";
import type { GraphFilter } from "@/lib/knowledge-graph";
import type { NodeKind, EdgeKind } from "@/data/knowledge-graph";
import type { MasteryLevel } from "@/data/mock";
import { MASTERY_FILL, NODE_SHAPE } from "@/data/knowledge-graph";

interface Props {
  filter: GraphFilter;
  onChange: (filter: GraphFilter) => void;
  stats: { total: number; visible: number; weaknesses: number };
}

const kindOptions: { value: NodeKind; label: string; shape: string }[] = [
  { value: "concept", label: "Conceitos", shape: "●" },
  { value: "formula", label: "Fórmulas", shape: "◆" },
  { value: "theorem", label: "Teoremas", shape: "⬡" },
];

const edgeOptions: { value: EdgeKind; label: string }[] = [
  { value: "depends_on", label: "Dependência" },
  { value: "connects", label: "Conexão" },
  { value: "appears_in_exam", label: "Prova" },
];

const masteryOptions: { value: MasteryLevel; label: string }[] = [
  { value: "none", label: "Nenhum" },
  { value: "exposed", label: "Exposto" },
  { value: "developing", label: "Desenvolvendo" },
  { value: "proficient", label: "Proficiente" },
  { value: "mastered", label: "Dominado" },
];

export function GraphFilters({ filter, onChange, stats }: Props) {
  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  return (
    <div className="space-y-3">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Buscar nó..."
          value={filter.searchQuery}
          onChange={(e) => onChange({ ...filter, searchQuery: e.target.value })}
          className="w-full rounded-md border border-border-default bg-bg-primary px-3 py-1.5 text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-primary focus:outline-none"
        />
      </div>

      {/* Discipline */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-muted">Disciplina</span>
        <div className="mt-1 flex gap-1">
          {([
            { v: "all" as const, l: "Todas" },
            { v: "calculo-1" as const, l: "Cálculo" },
            { v: "mat-discreta" as const, l: "Discreta" },
          ]).map((d) => (
            <button
              key={d.v}
              onClick={() => onChange({ ...filter, discipline: d.v })}
              className={`rounded-sm border px-2 py-0.5 text-[10px] transition-colors ${
                filter.discipline === d.v
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {d.l}
            </button>
          ))}
        </div>
      </div>

      {/* Node types */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-muted">Tipos de nó</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {kindOptions.map((k) => (
            <button
              key={k.value}
              onClick={() => onChange({ ...filter, kinds: toggle(filter.kinds, k.value) })}
              className={`rounded-sm border px-2 py-0.5 text-[10px] transition-colors ${
                filter.kinds.includes(k.value)
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {k.shape} {k.label}
            </button>
          ))}
        </div>
      </div>

      {/* Edge types */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-muted">Arestas</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {edgeOptions.map((e) => (
            <button
              key={e.value}
              onClick={() => onChange({ ...filter, edgeKinds: toggle(filter.edgeKinds, e.value) })}
              className={`rounded-sm border px-2 py-0.5 text-[10px] transition-colors ${
                filter.edgeKinds.includes(e.value)
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mastery filter */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-muted">Domínio</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {masteryOptions.map((m) => (
            <button
              key={m.value}
              onClick={() => onChange({ ...filter, masteryLevels: toggle(filter.masteryLevels, m.value) })}
              className={`flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] transition-colors ${
                filter.masteryLevels.includes(m.value)
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: MASTERY_FILL[m.value] }}
              />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weakness toggle */}
      <div>
        <button
          onClick={() => onChange({ ...filter, showWeaknessesOnly: !filter.showWeaknessesOnly })}
          className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors ${
            filter.showWeaknessesOnly
              ? "border-accent-danger bg-accent-danger/10 text-accent-danger"
              : "border-border-default text-fg-tertiary hover:text-fg-secondary"
          }`}
        >
          <span>⚠️</span>
          <span className="flex-1 text-left">Só fraquezas</span>
          {stats.weaknesses > 0 && (
            <Badge variant="danger">{stats.weaknesses}</Badge>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="rounded-md border border-border-default bg-bg-primary p-2">
        <div className="flex items-center justify-between text-[10px] text-fg-muted">
          <span>Visíveis</span>
          <span className="font-mono">{stats.visible}/{stats.total}</span>
        </div>
      </div>
    </div>
  );
}
