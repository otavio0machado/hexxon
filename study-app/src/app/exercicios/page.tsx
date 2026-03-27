"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getExercises,
  createExercise,
  createAttempt,
  getAttempts,
  createErrorOccurrence,
} from "@/lib/services/exercises";
import { getDisciplines, getAllTopics } from "@/lib/services/disciplines";
import type {
  Exercise,
  Topic,
  Discipline,
  Attempt,
} from "@/lib/supabase";
import {
  BookOpen,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type FilterDifficulty = "all" | "1" | "2" | "3" | "4" | "5";
type FilterType = "all" | "multiple_choice" | "open_ended" | "proof" | "computation";

const typeLabels: Record<Exercise["type"], string> = {
  multiple_choice: "Múltipla escolha",
  open_ended: "Dissertativo",
  proof: "Demonstração",
  computation: "Cálculo",
};

const typeColors: Record<Exercise["type"], string> = {
  multiple_choice: "bg-accent-primary/10 text-accent-primary border-accent-primary/30",
  open_ended: "bg-accent-warning/10 text-accent-warning border-accent-warning/30",
  proof: "bg-accent-success/10 text-accent-success border-accent-success/30",
  computation: "bg-accent-danger/10 text-accent-danger border-accent-danger/30",
};

interface PracticeState {
  exerciseId: string;
  answer: string;
  isLoading: boolean;
  hintIndex: number;
  feedback: string | null;
}

interface AIGenerationState {
  topicId: string;
  difficulty: number;
  count: number;
  isLoading: boolean;
}

export default function ExerciciosPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [topics, setTopics] = useState<Map<string, Topic>>(new Map());
  const [disciplines, setDisciplines] = useState<Map<string, Discipline>>(new Map());
  const [attempts, setAttempts] = useState<Map<string, Attempt[]>>(new Map());

  const [filterDiscipline, setFilterDiscipline] = useState<string>("all");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [practiceState, setPracticeState] = useState<PracticeState | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [aiGeneration, setAiGeneration] = useState<AIGenerationState | null>(null);
  const [expandedAttempts, setExpandedAttempts] = useState<Set<string>>(new Set());

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [exercisesData, topicsData, disciplinesData, attemptsData] = await Promise.all([
          getExercises(),
          getAllTopics(),
          getDisciplines(),
          getAttempts(200),
        ]);

        setExercises(exercisesData);

        const topicsMap = new Map<string, Topic>();
        topicsData.forEach((t) => topicsMap.set(t.id, t));
        setTopics(topicsMap);

        const disciplinesMap = new Map<string, Discipline>();
        disciplinesData.forEach((d) => disciplinesMap.set(d.id, d));
        setDisciplines(disciplinesMap);

        const attemptsMap = new Map<string, Attempt[]>();
        attemptsData.forEach((a) => {
          const key = a.exercise_id;
          if (!attemptsMap.has(key)) attemptsMap.set(key, []);
          attemptsMap.get(key)!.push(a);
        });
        setAttempts(attemptsMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar exercícios");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  const filtered = exercises.filter((e) => {
    if (filterDiscipline !== "all" && e.discipline_id !== filterDiscipline)
      return false;
    if (filterTopic !== "all" && e.topic_id !== filterTopic) return false;
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterDifficulty !== "all" && e.difficulty !== parseInt(filterDifficulty))
      return false;
    return true;
  });

  // Group by topic
  const grouped = new Map<string, Exercise[]>();
  filtered.forEach((e) => {
    const key = e.topic_id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e);
  });

  // Calculate stats
  const totalAttempted = attempts.size;
  const totalAvailable = exercises.length;
  const avgCorrect =
    attempts.size > 0
      ? Array.from(attempts.values()).reduce(
          (sum, arr) => sum + arr.filter((a) => a.is_correct).length,
          0
        ) / Array.from(attempts.values()).reduce((sum, arr) => sum + arr.length, 0)
      : 0;

  const handleStartPractice = useCallback((exercise: Exercise) => {
    setPracticeState({
      exerciseId: exercise.id,
      answer: "",
      isLoading: false,
      hintIndex: 0,
      feedback: null,
    });
    setExpandedExercise(exercise.id);
  }, []);

  const handleRevealHint = useCallback(() => {
    setPracticeState((prev) => {
      if (!prev) return null;
      const exercise = exercises.find((e) => e.id === prev.exerciseId);
      if (!exercise) return prev;
      return {
        ...prev,
        hintIndex: Math.min(prev.hintIndex + 1, exercise.hints.length),
      };
    });
  }, [exercises]);

  const handleSubmitAnswer = useCallback(
    async (exercise: Exercise) => {
      if (!practiceState) return;

      try {
        setPracticeState((prev) =>
          prev ? { ...prev, isLoading: true } : null
        );

        // Create attempt
        const attempt = await createAttempt({
          exercise_id: exercise.id,
          topic_id: exercise.topic_id,
          student_answer: practiceState.answer,
          is_correct: false, // In real scenario, would validate against solution
        });

        // Update local attempts
        setAttempts((prev) => {
          const key = exercise.id;
          const existing = prev.get(key) || [];
          return new Map(prev).set(key, [...existing, attempt]);
        });

        setPracticeState((prev) =>
          prev
            ? {
                ...prev,
                isLoading: false,
                feedback:
                  "Resposta submetida! Você pode revisar sua solução abaixo.",
              }
            : null
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao submeter resposta"
        );
      }
    },
    [practiceState]
  );

  const handleClassifyError = useCallback(
    async (exercise: Exercise) => {
      if (!practiceState) return;

      try {
        const topic = topics.get(exercise.topic_id);
        const discipline = disciplines.get(exercise.discipline_id);

        if (!topic || !discipline) {
          throw new Error("Tópico ou disciplina não encontrados");
        }

        setPracticeState((prev) =>
          prev ? { ...prev, isLoading: true } : null
        );

        const res = await fetch("/api/ai/classify-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseStatement: exercise.statement,
            correctAnswer: exercise.solution,
            studentAnswer: practiceState.answer,
            topicName: topic.name,
            courseName: discipline.name,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message ?? "Falha ao classificar erro");
        }

        const { data } = await res.json();

        // Save error occurrence
        await createErrorOccurrence({
          topic_id: exercise.topic_id,
          discipline_id: exercise.discipline_id,
          category: data.errorClass,
          severity: "medium",
          exercise_statement: exercise.statement,
          student_answer: practiceState.answer,
          correct_answer: exercise.solution,
          ai_explanation: data.explanation,
          ai_confidence: data.confidence,
          root_cause: data.likelyReasoning,
          remediation: data.remediation,
        });

        setPracticeState((prev) =>
          prev
            ? {
                ...prev,
                isLoading: false,
                feedback: `Tipo de erro: ${data.errorClass}\n\n${data.explanation}\n\nRemediação: ${data.remediation}`,
              }
            : null
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao classificar erro"
        );
      }
    },
    [topics, disciplines, practiceState]
  );

  const handleGenerateExercises = useCallback(
    async (topic: Topic) => {
      try {
        const discipline = disciplines.get(topic.discipline_id);
        if (!discipline) throw new Error("Disciplina não encontrada");

        setAiGeneration({
          topicId: topic.id,
          difficulty: 3,
          count: 3,
          isLoading: true,
        });

        const res = await fetch("/api/ai/exercises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicName: topic.name,
            courseName: discipline.name,
            masteryLevel: topic.mastery,
            count: 3,
            difficulty: 3,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message ?? "Falha ao gerar exercícios");
        }

        const { data } = await res.json();

        // Save each exercise
        const newExercises: Exercise[] = [];
        for (const ex of data.exercises) {
          const saved = await createExercise({
            topic_id: topic.id,
            discipline_id: topic.discipline_id,
            statement: ex.statement,
            type: ex.type,
            difficulty: ex.difficulty,
            solution: ex.solution,
            hints: ex.hints,
            concepts_tested: ex.conceptsTested,
            ai_generated: true,
          });
          newExercises.push(saved);
        }

        setExercises((prev) => [...prev, ...newExercises]);
        setAiGeneration(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao gerar exercícios"
        );
        setAiGeneration(null);
      }
    },
    [disciplines]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">
          Exercícios
        </h1>
        <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
          <p className="mt-2 text-sm text-fg-tertiary">Carregando exercícios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">
        Exercícios
      </h1>

      {error && (
        <div className="rounded-md border border-accent-danger/30 bg-accent-danger/10 p-3">
          <p className="text-sm text-accent-danger">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
            Total resolvidos
          </span>
          <p className="mt-1 font-mono text-lg font-semibold text-fg-primary">
            {totalAttempted}
            <span className="text-fg-tertiary">/{totalAvailable}</span>
          </p>
        </div>
        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
            Taxa de acerto
          </span>
          <p className="mt-1 font-mono text-lg font-semibold text-accent-success">
            {(avgCorrect * 100).toFixed(0)}%
          </p>
        </div>
        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
            Tópicos cobertos
          </span>
          <p className="mt-1 font-mono text-lg font-semibold text-fg-primary">
            {grouped.size}
            <span className="text-fg-tertiary">/{topics.size}</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
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

        {topics.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-fg-muted uppercase">
              Tópico:
            </span>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="rounded-sm border border-border-default bg-bg-surface px-2 py-1 text-xs text-fg-secondary outline-none"
            >
              <option value="all">Todos</option>
              {Array.from(topics.values()).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-fg-muted uppercase">
            Tipo:
          </span>
          {(["all", "multiple_choice", "open_ended", "proof", "computation"] as const).map(
            (type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`rounded-sm border px-2 py-1 text-xs transition-colors ${
                  filterType === type
                    ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                    : "border-border-default text-fg-tertiary hover:text-fg-secondary"
                }`}
              >
                {type === "all" ? "Todos" : typeLabels[type as Exercise["type"]]}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-fg-muted uppercase">
            Dificuldade:
          </span>
          {(["all", "1", "2", "3", "4", "5"] as const).map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => setFilterDifficulty(difficulty)}
              className={`rounded-sm border px-2 py-1 text-xs transition-colors ${
                filterDifficulty === difficulty
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {difficulty === "all" ? "Qualquer" : "⭐".repeat(parseInt(difficulty))}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises grouped by topic */}
      {grouped.size === 0 ? (
        <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-fg-muted" />
          <p className="mt-2 text-sm text-fg-tertiary">
            Nenhum exercício encontrado com os filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([topicId, exercisesList]) => {
            const topic = topics.get(topicId);
            const aiGen = aiGeneration?.topicId === topicId;

            return (
              <div key={topicId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-fg-secondary">
                    {topic?.name || "Tópico desconhecido"}
                  </h2>
                  {topic && !aiGen && (
                    <button
                      onClick={() => handleGenerateExercises(topic)}
                      className="flex items-center gap-1 rounded border border-accent-primary/30 bg-accent-primary/5 px-2 py-1 text-xs font-medium text-accent-primary transition-colors hover:bg-accent-primary/10"
                    >
                      <Zap className="h-3 w-3" />
                      Gerar com IA
                    </button>
                  )}
                  {aiGen && (
                    <div className="flex items-center gap-1 text-xs text-fg-tertiary">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                      Gerando...
                    </div>
                  )}
                </div>

                <div className="space-y-1 rounded-md border border-border-default bg-bg-surface">
                  {exercisesList.map((exercise) => {
                    const exerciseAttempts = attempts.get(exercise.id) || [];
                    const isExpanded = expandedExercise === exercise.id;
                    const isPracticing =
                      practiceState?.exerciseId === exercise.id;
                    const isShowingAttempts =
                      expandedAttempts.has(exercise.id);

                    return (
                      <div key={exercise.id}>
                        <button
                          onClick={() =>
                            setExpandedExercise(
                              isExpanded ? null : exercise.id
                            )
                          }
                          className="w-full border-b border-border-default px-4 py-3 text-left transition-colors hover:bg-bg-secondary last:border-b-0"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-fg-primary line-clamp-2">
                                  {exercise.statement.substring(0, 80)}...
                                </h3>
                                <span
                                  className={`rounded border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${typeColors[exercise.type]}`}
                                >
                                  {typeLabels[exercise.type]}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-fg-tertiary">
                                  {"⭐".repeat(exercise.difficulty)}
                                </span>
                                {exercise.concepts_tested.length > 0 && (
                                  <span className="text-xs text-fg-tertiary">
                                    {exercise.concepts_tested.slice(0, 2).join(", ")}
                                    {exercise.concepts_tested.length > 2 &&
                                      ` +${exercise.concepts_tested.length - 2}`}
                                  </span>
                                )}
                                {exerciseAttempts.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs">
                                    {exerciseAttempts.some((a) => a.is_correct) ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3 text-accent-success" />
                                        <span className="text-accent-success">
                                          {exerciseAttempts.filter((a) => a.is_correct).length}/
                                          {exerciseAttempts.length} corretas
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3 w-3 text-accent-danger" />
                                        <span className="text-accent-danger">
                                          {exerciseAttempts.length} tentativas
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-fg-muted flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-fg-muted flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {/* Expanded exercise details */}
                        {isExpanded && (
                          <div className="border-t border-border-default bg-bg-secondary px-4 py-3 space-y-3">
                            {/* Full statement */}
                            <div className="rounded-md border border-border-default bg-bg-primary p-3">
                              <p className="text-xs font-medium text-fg-muted uppercase mb-2">
                                Enunciado
                              </p>
                              <p className="text-sm text-fg-secondary whitespace-pre-wrap">
                                {exercise.statement}
                              </p>
                            </div>

                            {/* Practice mode */}
                            {!isPracticing ? (
                              <button
                                onClick={() => handleStartPractice(exercise)}
                                className="w-full rounded border border-accent-primary bg-accent-primary/10 px-3 py-2 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary/20"
                              >
                                Praticar
                              </button>
                            ) : (
                              <div className="space-y-2 rounded-md border border-border-default bg-bg-primary p-3">
                                <p className="text-xs font-medium text-fg-muted uppercase">
                                  Sua resposta
                                </p>
                                <textarea
                                  value={practiceState.answer}
                                  onChange={(e) =>
                                    setPracticeState((prev) =>
                                      prev
                                        ? { ...prev, answer: e.target.value }
                                        : null
                                    )
                                  }
                                  placeholder="Digite sua resposta aqui..."
                                  className="w-full rounded border border-border-default bg-bg-surface px-2 py-1 text-sm text-fg-secondary outline-none resize-none min-h-20"
                                  disabled={practiceState.isLoading}
                                />

                                {/* Hints */}
                                {exercise.hints.length > 0 && (
                                  <div>
                                    <button
                                      onClick={handleRevealHint}
                                      disabled={
                                        practiceState.hintIndex >=
                                        exercise.hints.length
                                      }
                                      className="flex items-center gap-1 rounded border border-border-default px-2 py-1 text-xs font-medium text-fg-tertiary transition-colors hover:text-fg-secondary disabled:opacity-50"
                                    >
                                      <Lightbulb className="h-3 w-3" />
                                      {practiceState.hintIndex <
                                      exercise.hints.length
                                        ? `Dica ${practiceState.hintIndex + 1}/${exercise.hints.length}`
                                        : "Sem mais dicas"}
                                    </button>
                                    {practiceState.hintIndex > 0 && (
                                      <p className="mt-1 rounded bg-accent-warning/10 px-2 py-1 text-xs text-fg-secondary">
                                        {
                                          exercise.hints[
                                            practiceState.hintIndex - 1
                                          ]
                                        }
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Submit and classify */}
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() =>
                                      handleSubmitAnswer(exercise)
                                    }
                                    disabled={
                                      practiceState.isLoading ||
                                      !practiceState.answer.trim()
                                    }
                                    className="flex-1 rounded border border-accent-primary bg-accent-primary/10 px-2 py-1 text-xs font-medium text-accent-primary transition-colors hover:bg-accent-primary/20 disabled:opacity-50"
                                  >
                                    {practiceState.isLoading
                                      ? "Submetendo..."
                                      : "Verificar"}
                                  </button>
                                  {practiceState.feedback && (
                                    <button
                                      onClick={() =>
                                        handleClassifyError(exercise)
                                      }
                                      disabled={practiceState.isLoading}
                                      className="flex-1 rounded border border-accent-danger bg-accent-danger/10 px-2 py-1 text-xs font-medium text-accent-danger transition-colors hover:bg-accent-danger/20 disabled:opacity-50"
                                    >
                                      Classificar erro com IA
                                    </button>
                                  )}
                                </div>

                                {/* Feedback */}
                                {practiceState.feedback && (
                                  <div className="rounded bg-accent-primary/10 p-2 text-xs text-fg-secondary whitespace-pre-wrap">
                                    {practiceState.feedback}
                                  </div>
                                )}

                                {/* Solution */}
                                <div className="rounded border border-border-default bg-bg-surface p-2">
                                  <p className="text-xs font-medium text-fg-muted uppercase mb-1">
                                    Solução esperada
                                  </p>
                                  <p className="text-xs text-fg-secondary whitespace-pre-wrap">
                                    {exercise.solution}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Attempt history */}
                            {exerciseAttempts.length > 0 && (
                              <div className="rounded-md border border-border-default bg-bg-primary p-3">
                                <button
                                  onClick={() =>
                                    setExpandedAttempts(
                                      isShowingAttempts
                                        ? new Set()
                                        : new Set([exercise.id])
                                    )
                                  }
                                  className="flex items-center gap-2 text-xs font-medium text-fg-muted uppercase"
                                >
                                  {isShowingAttempts ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                  Histórico ({exerciseAttempts.length} tentativas)
                                </button>

                                {isShowingAttempts && (
                                  <div className="mt-2 space-y-1">
                                    {exerciseAttempts
                                      .sort(
                                        (a, b) =>
                                          new Date(b.created_at).getTime() -
                                          new Date(a.created_at).getTime()
                                      )
                                      .map((attempt, i) => (
                                        <div
                                          key={attempt.id}
                                          className="rounded border border-border-default bg-bg-surface p-2 text-xs"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-fg-muted">
                                              Tentativa {i + 1}
                                            </span>
                                            {attempt.is_correct ? (
                                              <CheckCircle2 className="h-3 w-3 text-accent-success" />
                                            ) : (
                                              <XCircle className="h-3 w-3 text-accent-danger" />
                                            )}
                                          </div>
                                          <p className="mt-1 text-fg-secondary line-clamp-2">
                                            {attempt.student_answer}
                                          </p>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
