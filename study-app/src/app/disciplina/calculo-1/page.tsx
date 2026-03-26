import { MasteryDot } from "@/components/ui/mastery-dot";
import { ScoreDisplay } from "@/components/ui/score-display";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { mockTopicsCalc, mockErrorPatterns } from "@/data/mock";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const modules = [
  {
    id: "calc1-mod1",
    name: "Funções e Modelos",
    order: 1,
    status: "in_progress" as const,
    dateRange: "10 fev – 07 mar",
    topics: mockTopicsCalc.filter((t) => t.moduleId === "calc1-mod1"),
  },
  {
    id: "calc1-mod2",
    name: "Limites e Taxas de Variação",
    order: 2,
    status: "in_progress" as const,
    dateRange: "10 mar – 11 abr",
    topics: mockTopicsCalc.filter((t) => t.moduleId === "calc1-mod2"),
  },
  {
    id: "calc1-mod3",
    name: "Derivadas",
    order: 3,
    status: "not_started" as const,
    dateRange: "14 abr – 30 jun",
    topics: [],
  },
];

function moduleCoverage(topics: typeof mockTopicsCalc) {
  if (topics.length === 0) return 0;
  return Math.round((topics.reduce((s, t) => s + t.score, 0) / topics.length) * 100);
}

const statusLabel: Record<string, string> = {
  not_started: "not_started",
  in_progress: "in_progress",
  completed: "completed",
};

export default function CalculoPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-fg-tertiary hover:text-fg-secondary transition-colors">
          <ArrowLeft size={14} />
          Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg-primary">
          Cálculo I
        </h1>
        <p className="mt-1 text-sm text-fg-tertiary">
          4MAT096-04 · Prof. Luiz Henrique de Campos Merschmann · 3ª e 5ª · 60h
        </p>
      </div>

      {/* Grading */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
          Avaliações
        </h3>
        <div className="flex items-end gap-6">
          {["P1", "P2", "P3", "MT"].map((label) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">{label}</span>
              <span className="font-mono text-sm text-fg-tertiary">—</span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">G1</span>
            <span className="font-mono text-sm font-semibold text-fg-primary">—</span>
          </div>
        </div>
        <div className="relative mt-3 h-1.5 w-full bg-bg-tertiary">
          <div className="absolute top-0 h-full w-px bg-fg-muted" style={{ left: "60%" }} />
          <span className="absolute -bottom-4 font-mono text-[10px] text-fg-muted" style={{ left: "60%", transform: "translateX(-50%)" }}>
            6.0
          </span>
        </div>
        <p className="mt-6 text-xs text-fg-tertiary">
          Trabalhos: T1 (—) · T2 (—) · T3 (—) · T4 (—)
        </p>
      </div>

      {/* Modules */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-fg-muted">
          Módulos
        </h3>
        <div className="space-y-6">
          {modules.map((mod) => (
            <div key={mod.id}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-fg-muted">{String(mod.order).padStart(2, "0")}</span>
                  <span className="ml-2 text-sm font-semibold text-fg-primary">{mod.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-fg-tertiary">{mod.dateRange}</span>
                  <Badge variant="outline">{statusLabel[mod.status]}</Badge>
                </div>
              </div>

              {mod.topics.length > 0 ? (
                <>
                  <div className="mt-3 space-y-1.5">
                    <div className="grid grid-cols-[1fr_80px_60px_60px] gap-2 text-[10px] font-medium uppercase tracking-wider text-fg-muted px-1">
                      <span>Tópico</span>
                      <span>Mastery</span>
                      <span className="text-right">Score</span>
                      <span className="text-right">Exerc.</span>
                    </div>
                    {mod.topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="grid grid-cols-[1fr_80px_60px_60px] gap-2 items-center rounded-md px-1 py-1.5 hover:bg-bg-secondary transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MasteryDot level={topic.mastery} size="sm" />
                          <span className="text-sm text-fg-secondary truncate">{topic.name}</span>
                        </div>
                        <Badge variant="outline">{topic.mastery}</Badge>
                        <ScoreDisplay score={topic.score} className="text-right text-xs" />
                        <span className="text-right font-mono text-xs text-fg-tertiary">
                          {topic.exercisesAttempted}/{topic.exercisesAvailable}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <ProgressBar value={moduleCoverage(mod.topics)} variant="normal" className="flex-1" />
                    <span className="font-mono text-xs text-fg-tertiary">{moduleCoverage(mod.topics)}%</span>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs text-fg-tertiary">
                  5 tópicos · 0% coberto · Pré-req: Limites
                </p>
              )}

              {mod !== modules[modules.length - 1] && (
                <div className="mt-4 border-t border-border-subtle" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Patterns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Padrões de Erro
          </h3>
          <div className="space-y-2">
            {mockErrorPatterns.map((ep) => (
              <div key={ep.class} className="flex items-center gap-3">
                <span className="w-24 text-xs text-fg-secondary">{ep.class}</span>
                <div className="flex-1 h-1 bg-bg-tertiary rounded-none">
                  <div
                    className="h-full bg-accent-warning rounded-none"
                    style={{ width: `${(ep.count / 12) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-fg-tertiary w-6 text-right">{ep.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Documentos
          </h3>
          <div className="space-y-2">
            {[
              { name: "Plano de ensino", relevance: "critical" },
              { name: "Limites — slides", relevance: "high" },
              { name: "Lista 1", relevance: "high" },
              { name: "Stewart Cap.1", relevance: "medium" },
              { name: "Stewart Cap.2", relevance: "medium" },
            ].map((doc) => (
              <div key={doc.name} className="flex items-center justify-between py-1">
                <span className="text-sm text-fg-secondary">{doc.name}</span>
                <Badge variant={doc.relevance === "critical" ? "danger" : "outline"}>
                  {doc.relevance}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
