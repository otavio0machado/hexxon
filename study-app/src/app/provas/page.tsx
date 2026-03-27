"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getAssessments,
  updateAssessmentScore,
  updateAssessmentStatus,
  getAssessmentTopicIds,
} from "@/lib/services/assessments";
import { getDisciplines } from "@/lib/services/disciplines";
import { formatCountdown, countdownColor } from "@/lib/utils";
import type { Assessment, Discipline, AssessmentStatus } from "@/lib/supabase";
import { Calendar, Zap, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";

type FilterType = "all" | "prova" | "trabalho" | "ps" | "g2";
type FilterStatus = "all" | "upcoming" | "ready" | "completed";

const typeLabels: Record<Assessment["type"], string> = {
  prova: "Prova",
  trabalho: "Trabalho",
  ps: "PS",
  g2: "G2",
};

const typeColors: Record<Assessment["type"], string> = {
  prova: "bg-accent-danger/10 text-accent-danger border-accent-danger/30",
  trabalho: "bg-accent-primary/10 text-accent-primary border-accent-primary/30",
  ps: "bg-accent-warning/10 text-accent-warning border-accent-warning/30",
  g2: "bg-accent-success/10 text-accent-success border-accent-success/30",
};

const statusLabels: Record<AssessmentStatus, string> = {
  upcoming: "Próxima",
  ready: "Pronta",
  completed: "Finalizada",
};

const statusIcons: Record<AssessmentStatus, React.ReactNode> = {
  upcoming: <Clock className="h-4 w-4" />,
  ready: <AlertCircle className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
};

interface ScoreInputState {
  assessmentId: string;
  value: string;
  isLoading: boolean;
}

export default function ProvasPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [disciplines, setDisciplines] = useState<Map<string, Discipline>>(new Map());
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterDiscipline, setFilterDiscipline] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<ScoreInputState | null>(null);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [aiPlanLoading, setAiPlanLoading] = useState<string | null>(null);
  const [aiPlans, setAiPlans] = useState<Record<string, string>>({});

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [assessmentsData, disciplinesData] = await Promise.all([
          getAssessments(),
          getDisciplines(),
        ]);

        setAssessments(assessmentsData);

        const disciplinesMap = new Map<string, Discipline>();
        disciplinesData.forEach((d) => disciplinesMap.set(d.id, d));
        setDisciplines(disciplinesMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  const filtered = assessments.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterDiscipline !== "all" && a.discipline_id !== filterDiscipline)
      return false;
    return true;
  });

  // Get next exam countdown
  const nextExam = assessments
    .filter((a) => a.status !== "completed")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  // Group by discipline
  const grouped = new Map<string, Assessment[]>();
  filtered.forEach((a) => {
    const key = a.discipline_id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  });

  const handleSaveScore = useCallback(
    async (assessmentId: string) => {
      if (!scoreInput || scoreInput.assessmentId !== assessmentId) return;

      const score = parseFloat(scoreInput.value);
      if (isNaN(score) || score < 0 || score > 10) {
        setError("Score deve estar entre 0 e 10");
        return;
      }

      try {
        setScoreInput((prev) =>
          prev ? { ...prev, isLoading: true } : null
        );

        await updateAssessmentScore(assessmentId, score);

        // Update local state
        setAssessments((prev) =>
          prev.map((a) =>
            a.id === assessmentId ? { ...a, score, status: "completed" } : a
          )
        );

        setScoreInput(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao salvar score"
        );
      }
    },
    [scoreInput]
  );

  const handleStatusChange = useCallback(
    async (assessmentId: string, newStatus: AssessmentStatus) => {
      try {
        await updateAssessmentStatus(assessmentId, newStatus);
        setAssessments((prev) =>
          prev.map((a) =>
            a.id === assessmentId ? { ...a, status: newStatus } : a
          )
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao atualizar status"
        );
      }
    },
    []
  );

  const handleGenerateAIPlan = useCallback(
    async (assessment: Assessment) => {
      try {
        setAiPlanLoading(assessment.id);

        const topicIds = await getAssessmentTopicIds(assessment.id);
        const discipline = disciplines.get(assessment.discipline_id);

        if (!discipline) {
          throw new Error("Disciplina não encontrada");
        }

        const daysUntil = Math.ceil(
          (new Date(assessment.date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );

        const res = await fetch("/api/ai/exam-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examName: assessment.name,
            courseName: discipline.name,
            examDate: assessment.date,
            hoursPerDay: 3,
            topics: topicIds.map((id) => ({
              name: id,
              mastery: "developing",
              score: 0.5,
            })),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message ?? "Falha ao gerar plano");
        }

        const { data } = await res.json();
        const planText = [
          `📋 ${data.strategy}`,
          ``,
          `Total de dias: ${data.totalDays}`,
          `Tópicos de risco: ${data.riskTopics.join(", ") || "Nenhum"}`,
          ``,
          `Cronograma:`,
          ...data.blocks.map(
            (block: {
              day: number;
              date: string;
              topic: string;
              activity: string;
              durationMin: number;
              priority: string;
              rationale: string;
            }) =>
              `Dia ${block.day} — ${block.topic} (${block.activity}, ${block.durationMin}min, ${block.priority})`
          ),
        ].join("\n");

        setAiPlans((prev) => ({ ...prev, [assessment.id]: planText }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao gerar plano IA"
        );
      } finally {
        setAiPlanLoading(null);
      }
    },
    [disciplines]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">
          Provas
        </h1>
        <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <p className="mt-2 text-sm text-fg-tertiary">Carregando avaliações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">
          Provas
        </h1>
        {nextExam && (
          <div
            className={`rounded-md border border-l-4 bg-bg-surface p-3 ${countdownColor(nextExam.date)} ${
              new Date(nextExam.date).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
                ? "border-l-accent-danger"
                : "border-l-accent-warning"
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <div>
                <p className="text-xs font-medium text-fg-muted uppercase tracking-wider">
                  Próxima avaliação
                </p>
                <p className="font-semibold">
                  {nextExam.name} — {formatCountdown(nextExam.date)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-accent-danger/30 bg-accent-danger/10 p-3">
          <p className="text-sm text-accent-danger">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-fg-muted uppercase">
            Tipo:
          </span>
          {(["all", "prova", "trabalho", "ps", "g2"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-sm border px-2 py-1 text-xs transition-colors ${
                filterType === type
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {type === "all" ? "Todos" : typeLabels[type]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-fg-muted uppercase">
            Status:
          </span>
          {(["all", "upcoming", "ready", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-sm border px-2 py-1 text-xs transition-colors ${
                filterStatus === status
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {status === "all" ? "Todos" : statusLabels[status]}
            </button>
          ))}
        </div>

        {disciplines.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-fg-muted uppercase">
              Disciplina:
            </span>
            <select
              value={filterDiscipline}
              onChange={(e) => setFilterDiscipline(e.target.value)}
              className="rounded-sm border border-border-default bg-bg-surface px-2 py-1 text-xs text-fg-secondary outline-none"
            >
              <option value="all">Todas</option>
              {Array.from(disciplines.values()).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Assessments grouped by discipline */}
      {grouped.size === 0 ? (
        <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
          <Calendar className="mx-auto h-8 w-8 text-fg-muted" />
          <p className="mt-2 text-sm text-fg-tertiary">
            Nenhuma avaliação encontrada com os filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([disciplineId, assessmentsList]) => {
            const discipline = disciplines.get(disciplineId);
            return (
              <div key={disciplineId} className="space-y-2">
                <h2 className="text-sm font-semibold text-fg-secondary">
                  {discipline?.name || "Disciplina desconhecida"}
                </h2>

                <div className="space-y-1 rounded-md border border-border-default bg-bg-surface">
                  {assessmentsList
                    .sort(
                      (a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                    .map((assessment) => (
                      <div key={assessment.id}>
                        <button
                          onClick={() =>
                            setExpandedAssessment(
                              expandedAssessment === assessment.id
                                ? null
                                : assessment.id
                            )
                          }
                          className="w-full border-b border-border-default px-4 py-3 text-left transition-colors hover:bg-bg-secondary last:border-b-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-fg-primary">
                                  {assessment.name}
                                </h3>
                                <span
                                  className={`rounded border px-2 py-0.5 text-xs font-medium ${typeColors[assessment.type]}`}
                                >
                                  {typeLabels[assessment.type]}
                                </span>
                                <span className="flex items-center gap-1 rounded border border-border-default px-2 py-0.5 text-xs text-fg-tertiary">
                                  {statusIcons[assessment.status]}
                                  {statusLabels[assessment.status]}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-4 text-xs text-fg-tertiary">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(
                                    new Date(assessment.date),
                                    "d MMM yyyy",
                                    {
                                      locale: ptBR,
                                    }
                                  )}
                                </span>
                                <span className={countdownColor(assessment.date)}>
                                  {formatCountdown(assessment.date)}
                                </span>
                                {assessment.weight > 0 && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {(assessment.weight * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {assessment.status === "completed" &&
                              assessment.score !== null && (
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-accent-success">
                                    {assessment.score.toFixed(1)}
                                  </p>
                                  <p className="text-xs text-fg-muted">
                                    Nota final
                                  </p>
                                </div>
                              )}
                          </div>
                        </button>

                        {/* Expanded details */}
                        {expandedAssessment === assessment.id && (
                          <div className="border-t border-border-default bg-bg-secondary px-4 py-3 space-y-3">
                            {/* Score entry */}
                            {assessment.status !== "completed" ? (
                              <div className="rounded-md border border-border-default bg-bg-primary p-3">
                                <p className="text-xs font-medium text-fg-muted uppercase mb-2">
                                  Registrar nota
                                </p>
                                <div className="flex gap-2">
                                  {scoreInput?.assessmentId === assessment.id ? (
                                    <>
                                      <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={scoreInput.value}
                                        onChange={(e) =>
                                          setScoreInput((prev) =>
                                            prev
                                              ? {
                                                  ...prev,
                                                  value: e.target.value,
                                                }
                                              : null
                                          )
                                        }
                                        placeholder="Ex: 8.5"
                                        className="w-20 rounded border border-border-default bg-bg-primary px-2 py-1 text-sm text-fg-primary outline-none"
                                        disabled={scoreInput.isLoading}
                                      />
                                      <button
                                        onClick={() =>
                                          handleSaveScore(assessment.id)
                                        }
                                        disabled={scoreInput.isLoading}
                                        className="rounded border border-accent-primary bg-accent-primary/10 px-3 py-1 text-xs font-medium text-accent-primary transition-colors hover:bg-accent-primary/20 disabled:opacity-50"
                                      >
                                        {scoreInput.isLoading
                                          ? "Salvando..."
                                          : "Salvar"}
                                      </button>
                                      <button
                                        onClick={() => setScoreInput(null)}
                                        disabled={scoreInput.isLoading}
                                        className="rounded border border-border-default px-3 py-1 text-xs font-medium text-fg-tertiary transition-colors hover:text-fg-secondary disabled:opacity-50"
                                      >
                                        Cancelar
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setScoreInput({
                                          assessmentId: assessment.id,
                                          value: assessment.score?.toString() || "",
                                          isLoading: false,
                                        })
                                      }
                                      className="rounded border border-border-default px-3 py-1 text-xs font-medium text-fg-tertiary transition-colors hover:text-fg-secondary"
                                    >
                                      Inserir nota
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-md border border-accent-success/30 bg-accent-success/5 p-3">
                                <p className="text-xs font-medium text-fg-muted uppercase mb-2">
                                  Nota registrada
                                </p>
                                <p className="text-xl font-bold text-accent-success">
                                  {assessment.score}
                                </p>
                              </div>
                            )}

                            {/* Status buttons */}
                            {assessment.status !== "completed" && (
                              <div className="flex flex-wrap gap-2">
                                {(["upcoming", "ready", "completed"] as const)
                                  .filter((s) => s !== assessment.status)
                                  .map((status) => (
                                    <button
                                      key={status}
                                      onClick={() =>
                                        handleStatusChange(
                                          assessment.id,
                                          status
                                        )
                                      }
                                      className="rounded border border-border-default px-2 py-1 text-xs font-medium text-fg-tertiary transition-colors hover:text-fg-secondary"
                                    >
                                      Marcar como {statusLabels[status].toLowerCase()}
                                    </button>
                                  ))}
                              </div>
                            )}

                            {/* AI Plan generation */}
                            {assessment.type === "prova" &&
                              assessment.status !== "completed" && (
                                <div>
                                  {aiPlanLoading === assessment.id ? (
                                    <div className="flex items-center gap-2 rounded border border-accent-primary/30 bg-accent-primary/5 p-2">
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                                      <span className="text-xs text-fg-tertiary">
                                        Gerando plano com IA...
                                      </span>
                                    </div>
                                  ) : aiPlans[assessment.id] ? (
                                    <div className="rounded border border-accent-primary/30 bg-accent-primary/5 p-2">
                                      <pre className="whitespace-pre-wrap font-mono text-xs text-fg-secondary leading-relaxed overflow-auto max-h-48">
                                        {aiPlans[assessment.id]}
                                      </pre>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleGenerateAIPlan(assessment)
                                      }
                                      className="flex items-center gap-2 rounded border border-accent-primary/30 bg-accent-primary/5 px-3 py-2 text-xs font-medium text-accent-primary transition-colors hover:bg-accent-primary/10"
                                    >
                                      <Zap className="h-4 w-4" />
                                      Gerar plano de estudo com IA
                                    </button>
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
