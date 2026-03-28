"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { DayPanel } from "@/components/calendario/day-panel";
import { getAssessments } from "@/lib/services/assessments";
import { getStudySessions, createStudySession } from "@/lib/services/study-sessions";
import { getDisciplines } from "@/lib/services/disciplines";
import { getTasksByRange } from "@/lib/services/tasks";
import type { Assessment, StudySession, Discipline, SessionKind, Task } from "@/lib/supabase";
import { Plus, AlertCircle } from "lucide-react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const SESSION_KINDS: SessionKind[] = ["study", "exercise", "review", "simulation", "flashcard"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatMonth(year: number, month: number) {
  return new Date(year, month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getAssessmentType(type: string): { badge: "danger" | "warning" | "success"; label: string } {
  const map = {
    prova: { badge: "danger", label: "Prova" },
    trabalho: { badge: "warning", label: "Trabalho" },
    ps: { badge: "warning", label: "PS" },
    g2: { badge: "danger", label: "G2" },
  } satisfies Record<string, { badge: "danger" | "warning" | "success"; label: string }>;

  const entry = map[type as keyof typeof map];
  return entry ?? { badge: "warning", label: type };
}

function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

export default function CalendarioPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [upcomingRange, setUpcomingRange] = useState(7);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Modal form state
  const [formData, setFormData] = useState({
    discipline_id: "",
    kind: "study" as SessionKind,
    duration_min: 60,
    notes: "",
  });

  const todayStr = useMemo(() => today.toISOString().split("T")[0], []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch tasks for a wide range (current year)
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      const [a, s, d, t] = await Promise.all([
        getAssessments(),
        getStudySessions(200),
        getDisciplines(),
        getTasksByRange(yearStart, yearEnd).catch(() => []),
      ]);
      setAssessments(a);
      setSessions(s);
      setDisciplines(d);
      setTasks(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { loadData() }, [loadData]);

  // Handle session creation
  const handleCreateSession = async () => {
    if (!formData.discipline_id) {
      setToast("Selecione uma disciplina");
      return;
    }
    try {
      const newSession = await createStudySession({
        discipline_id: formData.discipline_id,
        kind: formData.kind,
        duration_min: formData.duration_min,
        notes: formData.notes || undefined,
      });
      setSessions([newSession, ...sessions]);
      setToast("Sessão criada com sucesso!");
      setShowModal(false);
      setFormData({ discipline_id: "", kind: "study", duration_min: 60, notes: "" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao criar sessão");
    }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Get events for this month
  const monthAssessments = assessments.filter((a) => {
    const d = new Date(a.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const monthSessions = sessions.filter((s) => {
    const d = new Date(s.created_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const monthTasks = tasks.filter((t) => {
    const d = new Date(t.date + "T12:00:00");
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const prev = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Calendário</h1>
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
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Calendário</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md border border-accent-primary bg-accent-primary/10 px-3 py-1.5 text-xs font-medium text-accent-primary hover:bg-accent-primary/20 transition-colors flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova sessão de estudo
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="rounded-md border border-border-default px-3 py-1 text-xs text-fg-tertiary hover:text-fg-secondary transition-colors">
          ← Anterior
        </button>
        <span className="text-sm font-semibold capitalize text-fg-primary">{formatMonth(year, month)}</span>
        <button onClick={next} className="rounded-md border border-border-default px-3 py-1 text-xs text-fg-tertiary hover:text-fg-secondary transition-colors">
          Próximo →
        </button>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
          <p className="text-sm text-fg-tertiary">Carregando calendário...</p>
        </div>
      ) : (
        <div className="rounded-md border border-border-default bg-bg-surface overflow-x-auto">
          <div className="grid grid-cols-7 border-b border-border-default">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
              const dayAssessments = day ? monthAssessments.filter((a) => a.date === dateStr) : [];
              const daySessions = day ? monthSessions.filter((s) => new Date(s.created_at).toISOString().split("T")[0] === dateStr) : [];
              const dayTasks = day ? monthTasks.filter((t) => t.date === dateStr) : [];
              const isToday = dateStr === todayStr;
              const hasItems = dayAssessments.length + daySessions.length + dayTasks.length > 0;

              return (
                <div
                  key={i}
                  onClick={() => day ? setSelectedDate(dateStr) : undefined}
                  className={`min-h-[100px] border-b border-r border-border-default p-2 transition-colors ${
                    !day ? "bg-bg-primary" : "bg-bg-surface hover:bg-bg-secondary/50 cursor-pointer"
                  } ${isToday ? "ring-1 ring-inset ring-accent-primary/40" : ""}`}
                >
                  {day && (
                    <>
                      <span className={`font-mono text-xs ${isToday ? "font-bold text-accent-primary" : "text-fg-tertiary"}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayAssessments.map((a) => {
                          const typeInfo = getAssessmentType(a.type);
                          return (
                            <div key={a.id} className="text-[10px]">
                              <Badge variant={typeInfo.badge}>{typeInfo.label}</Badge>
                              <p className="text-[9px] text-fg-secondary mt-0.5 line-clamp-1">{a.name}</p>
                            </div>
                          );
                        })}
                        {daySessions.map((s) => (
                          <div key={s.id} className="text-[10px]">
                            <div className="w-1 h-1 rounded-full bg-accent-primary inline-block mr-1" />
                            <span className="text-fg-tertiary">Estudo</span>
                          </div>
                        ))}
                        {dayTasks.slice(0, 3).map((t) => (
                          <div key={t.id} className="text-[10px] flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.is_completed ? 'bg-accent-success' : t.priority === 'high' ? 'bg-accent-danger' : 'bg-accent-warning'}`} />
                            <span className={`text-fg-secondary line-clamp-1 ${t.is_completed ? 'line-through opacity-50' : ''}`}>{t.title}</span>
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[9px] text-fg-muted">+{dayTasks.length - 3} mais</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming events with range selector */}
      <div className="rounded-md border border-border-default bg-bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Próximos eventos</h3>
          <Select
            value={String(upcomingRange)}
            onChange={(e) => setUpcomingRange(Number(e.target.value))}
            className="w-auto text-xs px-2 py-1"
          >
            <option value="3">3 dias</option>
            <option value="5">5 dias</option>
            <option value="7">7 dias</option>
            <option value="15">15 dias</option>
            <option value="30">30 dias</option>
            <option value="180">Semestre</option>
            <option value="365">Ano</option>
          </Select>
        </div>
        <div className="space-y-2">
          {/* Assessments in range */}
          {assessments
            .filter((a) => { const d = daysBetween(a.date, todayStr); return d >= 0 && d <= upcomingRange; })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((a) => {
              const days = daysBetween(a.date, todayStr);
              const typeInfo = getAssessmentType(a.type);
              const disc = disciplines.find(d => d.id === a.discipline_id);
              return (
                <div key={`a-${a.id}`} className="flex items-center justify-between py-2 border-l-2 border-l-accent-danger/30 pl-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant={typeInfo.badge}>{typeInfo.label}</Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-fg-primary">{a.name}</p>
                      <p className="text-xs text-fg-tertiary">{disc?.name}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-fg-muted flex-shrink-0">
                    {days === 0 ? "HOJE" : days === 1 ? "amanhã" : `em ${days}d`}
                  </span>
                </div>
              );
            })}
          {/* Tasks in range */}
          {tasks
            .filter((t) => { const d = daysBetween(t.date, todayStr); return d >= 0 && d <= upcomingRange; })
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((t) => {
              const days = daysBetween(t.date, todayStr);
              return (
                <div
                  key={`t-${t.id}`}
                  className={`flex items-center justify-between py-2 border-l-2 pl-3 ${
                    t.priority === 'high' ? 'border-l-accent-danger/30' : t.priority === 'medium' ? 'border-l-accent-warning/30' : 'border-l-border-default'
                  } ${t.is_completed ? 'opacity-50' : ''}`}
                  onClick={() => setSelectedDate(t.date)}
                >
                  <div className="flex items-center gap-3 flex-1 cursor-pointer">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      t.is_completed ? 'bg-accent-success border-accent-success' : 'border-border-default'
                    }`}>
                      {t.is_completed && <span className="text-white text-[8px]">✓</span>}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${t.is_completed ? 'line-through text-fg-muted' : 'text-fg-primary'}`}>{t.title}</p>
                      {t.start_time && <p className="text-xs text-fg-tertiary">{t.start_time}{t.end_time ? ` — ${t.end_time}` : ''}</p>}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-fg-muted flex-shrink-0">
                    {days === 0 ? "HOJE" : days === 1 ? "amanhã" : `em ${days}d`}
                  </span>
                </div>
              );
            })}
          {assessments.filter((a) => { const d = daysBetween(a.date, todayStr); return d >= 0 && d <= upcomingRange; }).length === 0 &&
           tasks.filter((t) => { const d = daysBetween(t.date, todayStr); return d >= 0 && d <= upcomingRange; }).length === 0 && (
            <p className="text-sm text-fg-tertiary text-center py-4">Nenhum evento nos próximos {upcomingRange} dias</p>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Sessão de Estudo">
        <div className="space-y-3">
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
            <label className="text-xs font-medium text-fg-secondary block mb-1">Tipo de Sessão</label>
            <Select
              value={formData.kind}
              onChange={(e) => setFormData({ ...formData, kind: e.target.value as SessionKind })}
            >
              {SESSION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-fg-secondary block mb-1">Duração (minutos)</label>
            <Input
              type="number"
              min="5"
              max="480"
              value={formData.duration_min}
              onChange={(e) => setFormData({ ...formData, duration_min: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-fg-secondary block mb-1">Notas</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Opcional..."
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleCreateSession}>
            Criar Sessão
          </Button>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-4 bg-bg-secondary border border-border-default text-fg-primary px-4 py-3 rounded-md text-sm">
          {toast}
        </div>
      )}

      {/* Day Panel */}
      {selectedDate && (
        <DayPanel
          date={selectedDate}
          assessments={assessments.filter((a) => a.date === selectedDate)}
          sessions={sessions.filter((s) => new Date(s.created_at).toISOString().split("T")[0] === selectedDate)}
          onClose={() => setSelectedDate(null)}
          onTasksChanged={loadData}
        />
      )}
    </div>
  );
}
