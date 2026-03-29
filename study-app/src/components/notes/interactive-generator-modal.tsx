"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export type InteractiveFrameHint = "auto" | "phone" | "canvas";

const LOADING_STAGES = [
  "Analisando o conteudo da nota...",
  "Projetando a experiencia interativa...",
  "Gerando HTML, CSS e JavaScript...",
  "Finalizando o bloco...",
];

function LoadingOverlay() {
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIdx((prev) => Math.min(prev + 1, LOADING_STAGES.length - 1));
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 py-8">
      {/* Spinner */}
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-accent-primary/20 border-t-accent-primary" />
      </div>

      {/* Stages */}
      <div className="flex flex-col items-center gap-2">
        {LOADING_STAGES.map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2 text-sm transition-all duration-500",
              i < stageIdx
                ? "text-fg-muted line-through opacity-50"
                : i === stageIdx
                  ? "text-accent-primary font-medium"
                  : "text-fg-muted/30",
            )}
          >
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full transition-all duration-500",
                i < stageIdx
                  ? "bg-fg-muted/40"
                  : i === stageIdx
                    ? "bg-accent-primary animate-pulse"
                    : "bg-fg-muted/20",
              )}
            />
            {label}
          </div>
        ))}
      </div>

      <p className="text-xs text-fg-muted/60">Isso costuma levar 5–15 segundos</p>
    </div>
  );
}

export function InteractiveGeneratorModal({
  loading,
  onClose,
  onGenerate,
}: {
  loading: boolean;
  onClose: () => void;
  onGenerate: (payload: {
    request: string;
    frameHint: InteractiveFrameHint;
  }) => Promise<void>;
}) {
  const [request, setRequest] = useState("");
  const [frameHint, setFrameHint] = useState<InteractiveFrameHint>("auto");

  const canSubmit = request.trim().length > 0 && !loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border-default bg-bg-primary p-6 shadow-2xl">
        {loading ? (
          <LoadingOverlay />
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fg-muted">
                Gerar Interativo
              </p>
              <h2 className="text-2xl font-semibold text-fg-primary">
                Descreva a experiencia interativa que deve nascer da nota
              </h2>
              <p className="text-sm leading-6 text-fg-secondary">
                Esse fluxo gera HTML/CSS/JS autocontido para mockups, dashboards, simuladores e
                explicacoes exploraveis vinculadas ao conteudo da nota.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
                  Preview preferido
                </label>
                <select
                  value={frameHint}
                  onChange={(event) => setFrameHint(event.target.value as InteractiveFrameHint)}
                  className="w-full rounded-xl border border-border-default bg-bg-surface px-3 py-2 text-sm text-fg-primary outline-none"
                >
                  <option value="auto">Automatico</option>
                  <option value="phone">Tela de celular</option>
                  <option value="canvas">Canvas amplo</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
                  Pedido
                </label>
                <textarea
                  value={request}
                  onChange={(event) => setRequest(event.target.value)}
                  rows={8}
                  placeholder="Ex.: gere um dashboard como se fosse um celular no transporte ativo, com cards de prioridade, progresso e proximas acoes baseadas nesta nota."
                  className="w-full rounded-2xl border border-border-default bg-bg-surface px-4 py-3 font-mono text-sm leading-6 text-fg-primary outline-none placeholder:text-fg-muted"
                />
              </div>
            </div>
          </>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border-default px-4 py-2 text-sm text-fg-secondary transition-colors hover:bg-bg-secondary"
          >
            Cancelar
          </button>
          {!loading && (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => onGenerate({ request, frameHint })}
              className="rounded-xl bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Gerar e inserir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
