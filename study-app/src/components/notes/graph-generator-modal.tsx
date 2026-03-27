"use client";

import { useState } from "react";

export type MermaidGraphType =
  | "auto"
  | "flowchart"
  | "mindmap"
  | "sequence"
  | "journey"
  | "quadrant"
  | "xychart";

export function GraphGeneratorModal({
  onClose,
  onGenerate,
  loading,
}: {
  onClose: () => void;
  onGenerate: (payload: { graphType: MermaidGraphType; request: string }) => Promise<void>;
  loading: boolean;
}) {
  const [graphType, setGraphType] = useState<MermaidGraphType>("auto");
  const [request, setRequest] = useState("");

  const canSubmit = request.trim().length > 0 && !loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border-default bg-bg-primary p-6 shadow-2xl">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fg-muted">
            Gerar Gráfico
          </p>
          <h2 className="text-2xl font-semibold text-fg-primary">
            Descreva o gráfico que você quer inserir
          </h2>
          <p className="text-sm leading-6 text-fg-secondary">
            O gráfico será gerado pela IA e inserido exatamente na posição atual do cursor na nota.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
              Tipo preferido
            </label>
            <select
              value={graphType}
              onChange={(event) => setGraphType(event.target.value as MermaidGraphType)}
              className="w-full rounded-xl border border-border-default bg-bg-surface px-3 py-2 text-sm text-fg-primary outline-none"
            >
              <option value="auto">Automático</option>
              <option value="flowchart">Fluxograma</option>
              <option value="mindmap">Mapa mental</option>
              <option value="sequence">Sequência</option>
              <option value="journey">Jornada</option>
              <option value="quadrant">Quadrantes</option>
              <option value="xychart">Gráfico XY</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
              Detalhes do gráfico
            </label>
            <textarea
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              rows={8}
              placeholder="Ex.: Crie um fluxograma comparando domínio de funções racionais, irracionais e logarítmicas, com exemplos rápidos e erros comuns."
              className="w-full rounded-2xl border border-border-default bg-bg-surface px-4 py-3 font-mono text-sm leading-6 text-fg-primary outline-none placeholder:text-fg-muted"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border-default px-4 py-2 text-sm text-fg-secondary transition-colors hover:bg-bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onGenerate({ graphType, request })}
            className="rounded-xl bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Gerando..." : "Gerar e inserir"}
          </button>
        </div>
      </div>
    </div>
  );
}
