"use client";

import mermaid from "mermaid";
import { AlertCircle, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { normalizeMermaidChart } from "@/lib/notes/mermaid";

let initialized = false;

function ensureMermaid() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "dark",
    suppressErrorRendering: true,
  });
  initialized = true;
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "");
  const renderId = useMemo(() => `mermaid-${id}`, [id]);
  const normalizedChart = useMemo(() => normalizeMermaidChart(chart), [chart]);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        ensureMermaid();
        const { svg: rendered } = await mermaid.render(renderId, normalizedChart);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (renderError) {
        if (!cancelled) {
          setSvg(null);
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Não foi possível renderizar o gráfico Mermaid.",
          );
        }
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [normalizedChart, renderId]);

  if (error) {
    return (
      <div className="rounded-xl border border-accent-danger/30 bg-accent-danger/5 p-4">
        <div className="flex items-start gap-2 text-accent-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Falha ao renderizar o gráfico</p>
              <p className="text-xs whitespace-pre-wrap opacity-80">{error}</p>
            <pre className="overflow-x-auto rounded-lg bg-bg-primary p-3 text-xs text-fg-secondary">
              {normalizedChart}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-default bg-bg-primary">
      <div className="flex items-center justify-between border-b border-border-default px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-widest text-fg-muted">Gráfico</p>
        <div className="flex items-center gap-1">
          <ControlButton onClick={() => setScale((value) => Math.max(0.6, value - 0.1))}>
            <Minus className="h-3 w-3" />
          </ControlButton>
          <ControlButton onClick={() => setScale(1)}>
            <RotateCcw className="h-3 w-3" />
          </ControlButton>
          <ControlButton onClick={() => setScale((value) => Math.min(2.4, value + 0.1))}>
            <Plus className="h-3 w-3" />
          </ControlButton>
        </div>
      </div>

      <div className="overflow-auto p-4">
        <div
          className="origin-top-left transition-transform"
          style={{ transform: `scale(${scale})`, width: "max-content" }}
          dangerouslySetInnerHTML={{ __html: svg ?? "" }}
        />
      </div>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-border-default bg-bg-secondary p-1.5 text-fg-secondary transition-colors hover:bg-bg-tertiary hover:text-fg-primary"
      type="button"
    >
      {children}
    </button>
  );
}
