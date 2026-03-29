"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type MindmapSource = "note" | "custom";

export function MindmapGeneratorModal({
  onClose,
  onGenerate,
  loading,
  hasNoteContent,
}: {
  onClose: () => void;
  onGenerate: (payload: { request: string; customContent?: string }) => Promise<void>;
  loading: boolean;
  hasNoteContent: boolean;
}) {
  const [source, setSource] = useState<MindmapSource>(hasNoteContent ? "note" : "custom");
  const [request, setRequest] = useState("");
  const [customContent, setCustomContent] = useState("");

  const canSubmit =
    !loading &&
    (source === "note"
      ? hasNoteContent && request.trim().length > 0
      : request.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border-default bg-bg-primary p-6 shadow-2xl">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fg-muted">
            Gerar Mapa Mental
          </p>
          <h2 className="text-2xl font-semibold text-fg-primary">
            Crie um mapa mental a partir de qualquer conteúdo
          </h2>
          <p className="text-sm leading-6 text-fg-secondary">
            O mapa mental será gerado como diagrama Mermaid editável dentro da nota.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {/* Source toggle */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
              Fonte do conteúdo
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSource("note")}
                disabled={!hasNoteContent}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  source === "note"
                    ? "border-accent-primary bg-accent-primary/10 font-medium text-accent-primary"
                    : "border-border-default text-fg-secondary hover:bg-bg-secondary",
                  !hasNoteContent && "cursor-not-allowed opacity-40",
                )}
              >
                A partir da nota
              </button>
              <button
                type="button"
                onClick={() => setSource("custom")}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  source === "custom"
                    ? "border-accent-primary bg-accent-primary/10 font-medium text-accent-primary"
                    : "border-border-default text-fg-secondary hover:bg-bg-secondary",
                )}
              >
                Texto livre
              </button>
            </div>
          </div>

          {/* Optional custom content textarea */}
          {source === "custom" && (
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
                Conteúdo base (opcional)
              </label>
              <textarea
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                rows={4}
                placeholder="Cole um texto para usar como base, ou deixe vazio e use apenas as instruções abaixo."
                className="w-full rounded-2xl border border-border-default bg-bg-surface px-4 py-3 text-sm leading-6 text-fg-primary outline-none placeholder:text-fg-muted"
              />
            </div>
          )}

          {/* Request */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-muted">
              Instruções para o mapa
            </label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={3}
              placeholder={
                source === "note"
                  ? "Ex.: organize os conceitos principais de funções em um mapa mental hierárquico"
                  : "Ex.: mapa mental sobre tipos de funções: linear, quadrática, exponencial e logarítmica"
              }
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
            onClick={() =>
              onGenerate({
                request,
                customContent: source === "custom" ? customContent : undefined,
              })
            }
            className="rounded-xl bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Gerando..." : "Gerar mapa mental"}
          </button>
        </div>
      </div>
    </div>
  );
}
