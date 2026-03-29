"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, ChevronDown, BarChart3, Code2, Network, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIMenuOption {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function AIMenuDropdown({
  onGenerateContent,
  onGenerateFlashcards,
  onGenerateInteractive,
  onGenerateGraph,
  onGenerateMindmap,
}: {
  onGenerateContent: () => void;
  onGenerateFlashcards: () => void;
  onGenerateInteractive: () => void;
  onGenerateGraph: () => void;
  onGenerateMindmap: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const options: AIMenuOption[] = [
    {
      key: "content",
      label: "Gerar conteúdo",
      description: "Texto gerado por IA para a nota",
      icon: <Sparkles className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onGenerateContent();
      },
    },
    {
      key: "flashcards",
      label: "Gerar flashcards",
      description: "Cards de revisão a partir da nota",
      icon: <Brain className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onGenerateFlashcards();
      },
    },
    {
      key: "interactive",
      label: "Gerar interativo",
      description: "Bloco HTML/CSS/JS interativo",
      icon: <Code2 className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onGenerateInteractive();
      },
    },
    {
      key: "mindmap",
      label: "Gerar mapa mental",
      description: "Mapa mental a partir da nota ou texto",
      icon: <Network className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onGenerateMindmap();
      },
    },
    {
      key: "graph",
      label: "Gerar gráfico",
      description: "Diagrama Mermaid na nota",
      icon: <BarChart3 className="h-4 w-4" />,
      onClick: () => {
        setOpen(false);
        onGenerateGraph();
      },
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all",
          open
            ? "bg-accent-primary text-white"
            : "bg-accent-primary text-white hover:opacity-90",
        )}
      >
        <Sparkles className="h-4 w-4" />
        Hexxon IA
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border-default/70 bg-bg-primary shadow-xl">
          <div className="p-1.5">
            {options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={opt.onClick}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-bg-secondary"
              >
                <span className="mt-0.5 text-accent-primary">{opt.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg-primary">{opt.label}</p>
                  <p className="text-xs text-fg-muted">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
