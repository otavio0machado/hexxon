"use client";

import { useState, useMemo, useCallback } from "react";
import { ExamTimeline } from "@/components/exam-prep/exam-timeline";
import { PlanningView } from "@/components/exam-prep/planning-view";
import { FinalReviewView } from "@/components/exam-prep/final-review-view";
import { SimulationView } from "@/components/exam-prep/simulation-view";
import { PostExamView } from "@/components/exam-prep/post-exam-view";
import { assessments } from "@/data/exam-data";
import type { Assessment, PrepMode } from "@/data/exam-data";
import { getUpcomingAssessments, getNextExam, detectPrepMode } from "@/lib/exam-prep";

export default function ProvasPage() {
  const upcoming = useMemo(() => getUpcomingAssessments(assessments), []);
  const nextExam = useMemo(() => getNextExam(assessments), []);

  const [selectedExam, setSelectedExam] = useState<Assessment | null>(nextExam);
  const [modeOverride, setModeOverride] = useState<PrepMode | null>(null);
  const [simResult, setSimResult] = useState<{ correct: number; total: number; timeUsedSec: number } | null>(null);
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [filterDiscipline, setFilterDiscipline] = useState<string>("all");

  const mode: PrepMode = modeOverride ?? (selectedExam ? detectPrepMode(selectedExam) : "planning");

  const filtered = filterDiscipline === "all"
    ? upcoming
    : upcoming.filter((a) => a.disciplineId === filterDiscipline);

  const handleStartSimulation = useCallback(() => {
    setModeOverride("simulation");
    setSimResult(null);
  }, []);

  const handleFinishSimulation = useCallback((result: { correct: number; total: number; timeUsedSec: number; answers: Record<string, string> }) => {
    setSimResult({ correct: result.correct, total: result.total, timeUsedSec: result.timeUsedSec });
    setModeOverride("post-exam");
  }, []);

  const handleBackToPlanning = useCallback(() => {
    setModeOverride(null);
    setSimResult(null);
    setAiPlan(null);
  }, []);

  const handleRequestAIPlan = useCallback(async () => {
    if (!selectedExam) return;
    setAiPlanLoading(true);
    setAiPlan(null);

    try {
      const res = await fetch("/api/ai/exam-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examName: selectedExam.name,
          courseName: selectedExam.disciplineName,
          examDate: selectedExam.date,
          hoursPerDay: 3,
          topics: selectedExam.topics.map((t) => ({
            name: t.name,
            mastery: t.mastery,
            score: t.score,
          })),
          errorPatterns: [
            { class: "procedural", count: 12 },
            { class: "conceptual", count: 6 },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setAiPlan(`Erro: ${err.error?.message ?? "Falha ao gerar plano."}`);
      } else {
        const { data } = await res.json();
        // Format the plan as readable text
        const lines = [
          `📋 Plano de Estudo — ${data.strategy}`,
          "",
          `Dias totais: ${data.totalDays}`,
          `Tópicos de risco: ${data.riskTopics.join(", ")}`,
          "",
          "Cronograma:",
          ...data.blocks.map((b: { day: number; date: string; topic: string; activity: string; durationMin: number; priority: string; rationale: string }) =>
            `  Dia ${b.day} (${b.date}) — ${b.topic} [${b.activity}] ${b.durationMin}min (${b.priority})\n    ${b.rationale}`
          ),
        ];
        setAiPlan(lines.join("\n"));
      }
    } catch {
      setAiPlan("Erro de rede. Verifique a conexão e a chave ANTHROPIC_API_KEY.");
    } finally {
      setAiPlanLoading(false);
    }
  }, [selectedExam]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Provas</h1>
        <div className="flex items-center gap-2">
          {(["all", "calculo-1", "mat-discreta"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterDiscipline(f)}
              className={`rounded-sm border px-2 py-0.5 text-xs transition-colors ${
                filterDiscipline === f
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {f === "all" ? "Todas" : f === "calculo-1" ? "Cálculo I" : "Discreta"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-4">
        {/* Left: timeline */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Cronograma
          </h2>
          <ExamTimeline
            assessments={filtered}
            onSelect={(exam) => { setSelectedExam(exam); setModeOverride(null); setSimResult(null); setAiPlan(null); }}
            selectedId={selectedExam?.id}
          />
        </div>

        {/* Right: mode views */}
        <div>
          {!selectedExam ? (
            <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
              <p className="text-sm text-fg-tertiary">Selecione uma avaliação no cronograma.</p>
            </div>
          ) : mode === "simulation" ? (
            <SimulationView
              exam={selectedExam}
              onFinish={handleFinishSimulation}
              onCancel={handleBackToPlanning}
            />
          ) : mode === "post-exam" ? (
            <PostExamView
              exam={selectedExam}
              simulationResult={simResult ?? undefined}
              onBackToPlanning={handleBackToPlanning}
            />
          ) : mode === "final-review" ? (
            <FinalReviewView
              exam={selectedExam}
              onStartSimulation={handleStartSimulation}
            />
          ) : (
            <>
              <PlanningView
                exam={selectedExam}
                onStartSimulation={handleStartSimulation}
                onRequestAIPlan={handleRequestAIPlan}
              />

              {/* AI Plan section */}
              {(aiPlanLoading || aiPlan) && (
                <div className="mt-4 rounded-md border border-accent-primary/30 bg-accent-primary/5 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-primary">
                    Plano de Estudo (IA)
                  </h3>
                  {aiPlanLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                      <span className="text-xs text-fg-tertiary">Gerando plano personalizado...</span>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-xs text-fg-secondary leading-relaxed">
                      {aiPlan}
                    </pre>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
