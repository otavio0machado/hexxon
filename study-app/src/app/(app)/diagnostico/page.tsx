"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getErrorOccurrences, resolveError, createErrorOccurrence } from "@/lib/services/exercises";
import { getDisciplines, getAllTopics } from "@/lib/services/disciplines";
import type { ErrorOccurrence, Discipline, Topic, ErrorCategory, ErrorSeverity } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle, CheckCircle, Plus } from "lucide-react";

type FilterStatus = "all" | "resolved" | "unresolved";

const SEVERITY_MAP: Record<ErrorSeverity, { badge: "danger" | "warning" | "success"; label: string }> = {
  critical: { badge: "danger", label: "Crítico" },
  high: { badge: "danger", label: "Alto" },
  medium: { badge: "warning", label: "Médio" },
  low: { badge: "warning", label: "Baixo" },
};

const CATEGORY_MAP: Record<ErrorCategory, string> = {
  conceptual: "Conceitual",
  algebraic: "Algébrico",
  logical: "Lógico",
  interpretation: "Interpretação",
  formalization: "Formalização",
};

const CATEGORY_COLORS: Record<ErrorCategory, string> = {
  conceptual: "bg-accent-danger/20",
  algebraic: "bg-accent-warning/20",
  logical: "bg-accent-info/20",
  interpretation: "bg-accent-success/20",
  formalization: "bg-accent-primary/20",
};

export default function DiagnosticoPage() {
  const [errors, setErrors] = useState<ErrorOccurrence[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterDisc, setFilterDisc] = useState<string>("all");
  const [selectedError, setSelectedError] = useState<ErrorOccurrence | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    exercise_statement: "",
    student_answer: "",
    correct_answer: "",
    topic_id: "",
    discipline_id: "",
    category: "conceptual" as ErrorCategory,
  });

  // Load data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [e, d, t] = await Promise.all([
          getErrorOccurrences(100),
          getDisciplines(),
          getAllTopics(),
        ]);
        setErrors(e);
        setDisciplines(d);
        setTopics(t);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter errors
  const filtered = useMemo(() => {
    let e = [...errors];
    if (filterDisc !== "all") e = e.filter(err => err.discipline_id === filterDisc);
    if (filterStatus === "resolved") e = e.filter(err => err.is_resolved);
    if (filterStatus === "unresolved") e = e.filter(err => !err.is_resolved);
    return e;
  }, [errors, filterDisc, filterStatus]);

  // Calculate stats
  const stats = useMemo(() => {
    const categoryDist = new Map<ErrorCategory, number>();
    const severityDist = new Map<ErrorSeverity, number>();

    errors.forEach(e => {
      categoryDist.set(e.category, (categoryDist.get(e.category) ?? 0) + 1);
      severityDist.set(e.severity, (severityDist.get(e.severity) ?? 0) + 1);
    });

    return {
      total: errors.length,
      resolved: errors.filter(e => e.is_resolved).length,
      unresolved: errors.filter(e => !e.is_resolved).length,
      categoryDist: Array.from(categoryDist.entries()),
      severityDist: Array.from(severityDist.entries()),
    };
  }, [errors]);

  // Handle resolve
  const handleResolve = async (id: string) => {
    try {
      await resolveError(id);
      setErrors(errors.map(e => e.id === id ? { ...e, is_resolved: true } : e));
      setSelectedError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao resolver erro");
    }
  };

  // Handle create error
  const handleCreateError = async () => {
    if (!formData.exercise_statement || !formData.student_answer || !formData.correct_answer || !formData.topic_id || !formData.discipline_id) {
      setError("Preencha todos os campos");
      return;
    }

    try {
      const newError = await createErrorOccurrence({
        exercise_statement: formData.exercise_statement,
        student_answer: formData.student_answer,
        correct_answer: formData.correct_answer,
        topic_id: formData.topic_id,
        discipline_id: formData.discipline_id,
        category: formData.category,
        severity: "medium",
      });
      setErrors([newError, ...errors]);
      setShowModal(false);
      setFormData({
        exercise_statement: "",
        student_answer: "",
        correct_answer: "",
        topic_id: "",
        discipline_id: "",
        category: "conceptual",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar erro");
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Diagnóstico de Erros</h1>
        <div className="rounded-md border border-accent-danger/30 bg-accent-danger/5 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent-danger mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-accent-danger">Erro ao carregar</p>
            <p className="text-xs text-fg-secondary mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Diagnóstico de Erros</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md border border-accent-primary bg-accent-primary/10 px-3 py-1.5 text-xs font-medium text-accent-primary hover:bg-accent-primary/20 transition-colors flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" />
          Classificar novo erro
        </button>
      </div>

      {/* Overview */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-md border border-border-default bg-bg-surface p-3">
            <p className="text-xs text-fg-tertiary mb-1">Total de Erros</p>
            <p className="text-2xl font-bold text-fg-primary">{stats.total}</p>
          </div>
          <div className="rounded-md border border-border-default bg-bg-surface p-3">
            <p className="text-xs text-fg-tertiary mb-1">Resolvidos</p>
            <p className="text-2xl font-bold text-accent-success">{stats.resolved}</p>
          </div>
          <div className="rounded-md border border-border-default bg-bg-surface p-3">
            <p className="text-xs text-fg-tertiary mb-1">Não Resolvidos</p>
            <p className="text-2xl font-bold text-accent-danger">{stats.unresolved}</p>
          </div>
          <div className="rounded-md border border-border-default bg-bg-surface p-3">
            <p className="text-xs text-fg-tertiary mb-1">Taxa de Resolução</p>
            <p className="text-2xl font-bold text-accent-primary">
              {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Category distribution */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-3">
            Erros por Categoria
          </h3>
          <div className="space-y-2">
            {stats.categoryDist.map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat]}`} />
                <span className="text-xs text-fg-secondary flex-1">{CATEGORY_MAP[cat]}</span>
                <span className="text-xs font-mono text-fg-muted">{count}</span>
                <div className="h-1.5 rounded-full bg-border-default flex-1 max-w-xs">
                  <div
                    className="h-full bg-accent-primary rounded-full"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border-default bg-bg-surface p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-3">
            Erros por Severidade
          </h3>
          <div className="space-y-2">
            {["critical", "high", "medium", "low"].map((sev) => {
              const count = stats.severityDist.find(([s]) => s === sev)?.[1] ?? 0;
              return (
                <div key={sev} className="flex items-center gap-3">
                  <Badge variant={SEVERITY_MAP[sev as ErrorSeverity].badge}>
                    {SEVERITY_MAP[sev as ErrorSeverity].label}
                  </Badge>
                  <span className="text-xs font-mono text-fg-muted ml-auto">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error feed */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-tertiary">Filtrar:</span>
          {(["all", "unresolved", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-sm border px-2 py-0.5 text-xs transition-colors ${
                filterStatus === s
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {s === "all" ? "Todos" : s === "unresolved" ? "Não Resolvidos" : "Resolvidos"}
            </button>
          ))}

          {/* Discipline filter */}
          <Select
            value={filterDisc}
            onChange={(e) => setFilterDisc(e.target.value)}
            className="ml-auto w-auto rounded-sm px-2 py-0.5 text-xs"
          >
            <option value="all">Todas as Disciplinas</option>
            {disciplines.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>

          <span className="font-mono text-xs text-fg-muted">{filtered.length} erros</span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState title="Nenhum erro encontrado" description="Tente ajustar os filtros." />
          ) : (
            filtered.map(err => {
              const topic = topics.find(t => t.id === err.topic_id);
              const disc = disciplines.find(d => d.id === err.discipline_id);
              const isExpanded = expandedId === err.id;

              return (
                <div
                  key={err.id}
                  className={`rounded-md border transition-colors cursor-pointer ${
                    isExpanded
                      ? "border-accent-primary/50 bg-accent-primary/5"
                      : err.is_resolved
                      ? "border-accent-success/30 bg-accent-success/5"
                      : "border-accent-danger/30 bg-accent-danger/5"
                  }`}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : err.id)}
                    className="p-3 flex items-start gap-3"
                  >
                    {err.is_resolved ? (
                      <CheckCircle className="w-4 h-4 text-accent-success mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-accent-danger mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <Badge variant="warning">{CATEGORY_MAP[err.category]}</Badge>
                        <Badge variant={SEVERITY_MAP[err.severity].badge}>
                          {SEVERITY_MAP[err.severity].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-fg-secondary line-clamp-2">{err.exercise_statement}</p>
                      <p className="text-xs text-fg-tertiary mt-1">
                        {topic?.name} • {disc?.name}
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border-default p-3 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-fg-muted mb-1">Resposta do Aluno</p>
                        <p className="text-sm text-fg-secondary bg-bg-primary rounded px-2 py-1">{err.student_answer}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-fg-muted mb-1">Resposta Correta</p>
                        <p className="text-sm text-fg-secondary bg-bg-primary rounded px-2 py-1">{err.correct_answer}</p>
                      </div>
                      {err.ai_explanation && (
                        <div>
                          <p className="text-xs font-semibold text-fg-muted mb-1">Explicação IA</p>
                          <p className="text-sm text-fg-secondary">{err.ai_explanation}</p>
                        </div>
                      )}
                      {!err.is_resolved && (
                        <button
                          onClick={() => handleResolve(err.id)}
                          className="w-full rounded border border-accent-success bg-accent-success/10 px-2 py-1.5 text-xs font-medium text-accent-success hover:bg-accent-success/20 transition-colors"
                        >
                          Marcar como Resolvido
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Classificar Novo Erro">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-fg-secondary block mb-1">Enunciado do Exercício</label>
            <Textarea
              value={formData.exercise_statement}
              onChange={(e) => setFormData({ ...formData, exercise_statement: e.target.value })}
              rows={2}
              placeholder="Digite o enunciado..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-fg-secondary block mb-1">Resposta do Aluno</label>
            <Textarea
              value={formData.student_answer}
              onChange={(e) => setFormData({ ...formData, student_answer: e.target.value })}
              rows={2}
              placeholder="O que o aluno respondeu..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-fg-secondary block mb-1">Resposta Correta</label>
            <Textarea
              value={formData.correct_answer}
              onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
              rows={2}
              placeholder="A resposta correta..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-fg-secondary block mb-1">Disciplina</label>
            <Select
              value={formData.discipline_id}
              onChange={(e) => setFormData({ ...formData, discipline_id: e.target.value })}
            >
              <option value="">Selecione uma disciplina</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-fg-secondary block mb-1">Tópico</label>
            <Select
              value={formData.topic_id}
              onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
            >
              <option value="">Selecione um tópico</option>
              {topics
                .filter(t => !formData.discipline_id || t.discipline_id === formData.discipline_id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-fg-secondary block mb-1">Categoria de Erro</label>
            <Select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ErrorCategory })}
            >
              {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowModal(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleCreateError}
          >
            Classificar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
