import { MasteryDot } from "@/components/ui/mastery-dot";
import { ScoreDisplay } from "@/components/ui/score-display";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { mockTopicsMD } from "@/data/mock";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const modules = [
  {
    id: "md-mod1",
    name: "Lógica",
    order: 1,
    status: "in_progress" as const,
    dateRange: "11 fev – 18 mar",
    topics: mockTopicsMD.filter((t) => t.moduleId === "md-mod1"),
  },
  {
    id: "md-mod2",
    name: "Conjuntos",
    order: 2,
    status: "in_progress" as const,
    dateRange: "20 mar – 15 abr",
    topics: mockTopicsMD.filter((t) => t.moduleId === "md-mod2"),
  },
  {
    id: "md-mod3",
    name: "Relações e Funções",
    order: 3,
    status: "in_progress" as const,
    dateRange: "17 abr – 30 jun",
    topics: mockTopicsMD.filter((t) => t.moduleId === "md-mod3"),
  },
];

function moduleCoverage(topics: typeof mockTopicsMD) {
  if (topics.length === 0) return 0;
  return Math.round((topics.reduce((s, t) => s + t.score, 0) / topics.length) * 100);
}

export default function MatDiscretaPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-fg-tertiary hover:text-fg-secondary transition-colors">
          <ArrowLeft size={14} />
          Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg-primary">
          Matemática Discreta
        </h1>
        <p className="mt-1 text-sm text-fg-tertiary">
          4MAT108-06 · Prof. Laira Vieira Toscani · 2ª e 4ª · 60h
        </p>
      </div>

      {/* Grading */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">Avaliações</h3>
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
          <span className="absolute -bottom-4 font-mono text-[10px] text-fg-muted" style={{ left: "60%", transform: "translateX(-50%)" }}>6.0</span>
        </div>
        <p className="mt-6 text-xs text-fg-tertiary">Trabalhos: T1 (—) · T2 (—) · T3 (—)</p>
      </div>

      {/* Modules */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-fg-muted">Módulos</h3>
        <div className="space-y-6">
          {modules.map((mod, i) => (
            <div key={mod.id}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-fg-muted">{String(mod.order).padStart(2, "0")}</span>
                  <span className="ml-2 text-sm font-semibold text-fg-primary">{mod.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-fg-tertiary">{mod.dateRange}</span>
                  <Badge variant="outline">{mod.status}</Badge>
                </div>
              </div>
              {mod.topics.length > 0 && (
                <>
                  <div className="mt-3 space-y-1.5">
                    <div className="grid grid-cols-[1fr_80px_60px_60px] gap-2 text-[10px] font-medium uppercase tracking-wider text-fg-muted px-1">
                      <span>Tópico</span><span>Mastery</span><span className="text-right">Score</span><span className="text-right">Exerc.</span>
                    </div>
                    {mod.topics.map((topic) => (
                      <div key={topic.id} className="grid grid-cols-[1fr_80px_60px_60px] gap-2 items-center rounded-md px-1 py-1.5 hover:bg-bg-secondary transition-colors">
                        <div className="flex items-center gap-2">
                          <MasteryDot level={topic.mastery} size="sm" />
                          <span className="text-sm text-fg-secondary truncate">{topic.name}</span>
                        </div>
                        <Badge variant="outline">{topic.mastery}</Badge>
                        <ScoreDisplay score={topic.score} className="text-right text-xs" />
                        <span className="text-right font-mono text-xs text-fg-tertiary">{topic.exercisesAttempted}/{topic.exercisesAvailable}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <ProgressBar value={moduleCoverage(mod.topics)} variant="normal" className="flex-1" />
                    <span className="font-mono text-xs text-fg-tertiary">{moduleCoverage(mod.topics)}%</span>
                  </div>
                </>
              )}
              {i < modules.length - 1 && <div className="mt-4 border-t border-border-subtle" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
