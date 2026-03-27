"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type BootstrapPhase =
  | "idle"
  | "loading_docs"
  | "generating"
  | "populating"
  | "review"
  | "done"
  | "error";

interface BootstrapDiscipline {
  id?: string;
  name: string;
  professor?: string;
  modules: Array<{
    name: string;
    order: number;
    topics: Array<{ name: string; difficulty: number; prerequisites: string[] }>;
  }>;
  assessments: Array<{
    name: string;
    type: string;
    date?: string;
    weight?: number;
    topics: string[];
  }>;
}

interface BootstrapData {
  disciplines: BootstrapDiscipline[];
  stats?: {
    disciplines: number;
    flashcards: number;
    kgNodes: number;
    kgEdges: number;
  };
  hasLegacyData?: boolean;
}

export default function OnboardingBootstrapPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<BootstrapPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [data, setData] = useState<BootstrapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runBootstrap() {
    setPhase("loading_docs");
    setProgress(10);
    setStatusText("Carregando documentos processados...");

    try {
      setPhase("generating");
      setProgress(30);
      setStatusText("Jarvis esta analisando seus materiais e gerando o curriculo...");

      const res = await fetch("/api/onboarding/bootstrap", { method: "POST" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro no bootstrap");
      }

      setProgress(80);
      setStatusText("Populando banco de dados...");
      setPhase("populating");

      const result = await res.json();

      setProgress(100);
      setData({
        disciplines: result.curriculum?.disciplines || [],
        stats: result.stats,
        hasLegacyData: result.hasLegacyData,
      });
      setPhase("review");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  async function handleFinish() {
    setPhase("done");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Claim legacy data if any
      await fetch("/api/admin/claim-legacy-data", { method: "POST" }).catch(
        () => {}
      );

      await supabase
        .from("user_profiles")
        .update({
          onboarding_completed: true,
          onboarding_step: "completed",
        })
        .eq("id", user.id);
    }

    router.push("/dashboard");
    router.refresh();
  }

  // Auto-start on mount
  useEffect(() => {
    if (phase === "idle") {
      runBootstrap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Progress animation
  if (phase !== "review" && phase !== "done" && phase !== "error") {
    return (
      <div className="space-y-8 text-center">
        <div className="space-y-4">
          <div className="text-6xl">🧠</div>
          <h1 className="text-2xl font-bold text-fg-primary">
            Jarvis esta configurando seu sistema...
          </h1>
          <p className="text-sm text-fg-secondary max-w-md mx-auto">
            {statusText}
          </p>
        </div>

        {/* Progress bar */}
        <div className="max-w-md mx-auto">
          <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-primary transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-fg-muted">{progress}%</p>
        </div>

        {/* Steps */}
        <div className="space-y-3 text-left max-w-md mx-auto">
          <StepItem
            label="Documentos lidos e classificados"
            done={progress >= 20}
            active={phase === "loading_docs"}
          />
          <StepItem
            label="Gerando curriculo personalizado"
            done={progress >= 60}
            active={phase === "generating"}
          />
          <StepItem
            label="Populando sistema com dados"
            done={progress >= 90}
            active={phase === "populating"}
          />
          <StepItem
            label="Gerando flashcards iniciais"
            done={progress >= 100}
            active={false}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (phase === "error") {
    return (
      <div className="space-y-8 text-center">
        <div className="space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-fg-primary">
            Houve um problema
          </h1>
          <p className="text-sm text-fg-secondary max-w-md mx-auto">
            {error || "Erro desconhecido durante o bootstrap"}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setError(null);
              setPhase("idle");
              runBootstrap();
            }}
            className="rounded-xl border border-border-default px-6 py-3 text-sm font-medium text-fg-secondary hover:bg-bg-secondary"
          >
            Tentar novamente
          </button>
          <button
            onClick={handleFinish}
            className="rounded-xl bg-accent-primary px-6 py-3 text-sm font-semibold text-white hover:bg-accent-primary/90"
          >
            Pular e ir para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Review state
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="text-2xl font-bold text-fg-primary">
          {data?.hasLegacyData
            ? "Dados existentes preservados!"
            : "Jarvis configurou seu sistema!"}
        </h1>
        <p className="text-sm text-fg-secondary max-w-lg mx-auto">
          {data?.hasLegacyData
            ? "Seus dados existentes foram mantidos. O curriculo abaixo foi gerado como referencia."
            : "Revise o que foi gerado baseado nos seus materiais. Voce pode ajustar tudo depois."}
        </p>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-lg mx-auto">
          <StatCard
            label="Disciplinas"
            value={data.stats.disciplines}
          />
          <StatCard label="Flashcards" value={data.stats.flashcards} />
          <StatCard label="Nos do Grafo" value={data.stats.kgNodes} />
          <StatCard label="Conexoes" value={data.stats.kgEdges} />
        </div>
      )}

      {/* Disciplines review */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {data?.disciplines.map((disc, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-default bg-bg-surface p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-fg-primary">
                  📚 {disc.name}
                </h3>
                {disc.professor && (
                  <p className="text-xs text-fg-muted">{disc.professor}</p>
                )}
              </div>
              <span className="text-xs text-fg-muted">
                {disc.modules.reduce((acc, m) => acc + m.topics.length, 0)}{" "}
                topicos ·{" "}
                {disc.assessments?.length || 0} avaliacoes
              </span>
            </div>

            {/* Modules */}
            <div className="space-y-2">
              {disc.modules.map((mod, j) => (
                <div key={j} className="pl-4 border-l-2 border-border-default">
                  <p className="text-sm font-medium text-fg-secondary">
                    {mod.name}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mod.topics.map((topic, k) => (
                      <span
                        key={k}
                        className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs text-fg-muted"
                      >
                        {topic.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Assessments */}
            {disc.assessments && disc.assessments.length > 0 && (
              <div className="pt-2 border-t border-border-default">
                <p className="text-xs font-medium text-fg-muted mb-1">
                  Avaliacoes:
                </p>
                <div className="flex flex-wrap gap-2">
                  {disc.assessments.map((a, j) => (
                    <span
                      key={j}
                      className="rounded-full bg-accent-primary/10 px-2 py-0.5 text-xs text-accent-primary"
                    >
                      {a.name}
                      {a.date && ` (${new Date(a.date).toLocaleDateString("pt-BR")})`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Finish button */}
      <div className="text-center">
        <button
          onClick={handleFinish}
          className="rounded-xl bg-accent-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90"
        >
          Esta tudo certo — comecar a usar o cogni.
        </button>
      </div>
    </div>
  );
}

function StepItem({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-surface p-3">
      <span
        className={
          done
            ? "text-accent-success"
            : active
            ? "text-accent-primary animate-pulse"
            : "text-fg-muted"
        }
      >
        {done ? "✓" : active ? "⏳" : "○"}
      </span>
      <span
        className={`text-sm ${
          done || active ? "text-fg-primary" : "text-fg-muted"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-surface px-4 py-3 text-center">
      <p className="text-2xl font-semibold text-fg-primary">{value}</p>
      <p className="text-xs text-fg-muted">{label}</p>
    </div>
  );
}
