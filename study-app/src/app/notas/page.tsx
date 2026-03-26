"use client";

import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { NoteViewer } from "@/components/notes/note-viewer";
import { FlashcardDeck } from "@/components/notes/flashcard-deck";
import { OralQuiz } from "@/components/notes/oral-quiz";
import { NotesStatsBar } from "@/components/notes/notes-stats";
import {
  filterNotes,
  filterFlashcards,
  filterOralQuestions,
  getNotesStats,
  exportNoteAsMarkdown,
  exportFlashcardsAsMarkdown,
  exportOralQuestionsAsMarkdown,
  defaultNoteFilter,
  defaultFlashcardFilter,
  defaultOralFilter,
  type NoteFilter,
  type FlashcardFilter,
  type OralFilter,
} from "@/lib/notes-flashcards";
import type { StudyNote } from "@/data/notes-flashcards";
import { formatLabels, formatIcons, statusLabels, cardTypeLabels, difficultyLabels } from "@/data/notes-flashcards";

type TabView = "notas" | "flashcards" | "oral";
type DisciplineFilter = "all" | "calculo-1" | "mat-discreta";

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function NotasPage() {
  // Tab state
  const [tab, setTab] = useState<TabView>("notas");
  const [discipline, setDiscipline] = useState<DisciplineFilter>("all");
  const [search, setSearch] = useState("");

  // Note state
  const [noteFilter, setNoteFilter] = useState<NoteFilter>(defaultNoteFilter);
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);

  // Flashcard state
  const [fcFilter, setFcFilter] = useState<FlashcardFilter>(defaultFlashcardFilter);
  const [studyMode, setStudyMode] = useState(false);

  // Oral state
  const [oralFilter, setOralFilter] = useState<OralFilter>(defaultOralFilter);
  const [quizMode, setQuizMode] = useState(false);

  // AI loading
  const [aiLoading, setAiLoading] = useState(false);

  // Derived data
  const stats = useMemo(() => getNotesStats(), []);

  const notes = useMemo(
    () => filterNotes({ ...noteFilter, discipline, search }),
    [noteFilter, discipline, search]
  );

  const flashcards = useMemo(
    () => filterFlashcards({ ...fcFilter, discipline, search }),
    [fcFilter, discipline, search]
  );

  const oralQuestions = useMemo(
    () => filterOralQuestions({ ...oralFilter, discipline, search }),
    [oralFilter, discipline, search]
  );

  const handleExportNote = useCallback((note: StudyNote) => {
    const md = exportNoteAsMarkdown(note);
    downloadMarkdown(md, `${note.topicId}-${note.format}.md`);
  }, []);

  const handleExportAllFlashcards = useCallback(() => {
    const md = exportFlashcardsAsMarkdown(flashcards);
    downloadMarkdown(md, "flashcards.md");
  }, [flashcards]);

  const handleExportAllOral = useCallback(() => {
    const md = exportOralQuestionsAsMarkdown(oralQuestions);
    downloadMarkdown(md, "perguntas-orais.md");
  }, [oralQuestions]);

  const handleTopicClick = useCallback((topicId: string) => {
    // Find note for this topic
    const note = notes.find((n) => n.topicId === topicId);
    if (note) setSelectedNote(note);
  }, [notes]);

  const handleGenerateAI = useCallback(async (service: string) => {
    setAiLoading(true);
    // In production: call /api/ai/{service}
    // For now: show feedback
    setTimeout(() => setAiLoading(false), 1500);
  }, []);

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">
            Notas & Flashcards
          </h1>
          <p className="text-xs text-fg-tertiary">
            {stats.totalNotes} notas · {stats.totalFlashcards} flashcards · {stats.totalOral} orais
            {stats.dueFlashcards > 0 && (
              <span className="ml-1 text-accent-warning">
                · {stats.dueFlashcards} pendente(s)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      <NotesStatsBar stats={stats} />

      {/* Tabs + Global filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {([
            { v: "notas" as const, l: "Notas", count: notes.length },
            { v: "flashcards" as const, l: "Flashcards", count: flashcards.length },
            { v: "oral" as const, l: "Oral", count: oralQuestions.length },
          ]).map((t) => (
            <button
              key={t.v}
              onClick={() => { setTab(t.v); setStudyMode(false); setQuizMode(false); setSelectedNote(null); }}
              className={`rounded-sm border px-3 py-1 text-xs transition-colors ${
                tab === t.v
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {t.l}
              <span className="ml-1 font-mono text-[10px] opacity-60">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded-md border border-border-default bg-bg-surface px-3 py-1 text-xs text-fg-secondary placeholder:text-fg-muted outline-none focus:border-accent-primary/50"
          />
          {/* Discipline filter */}
          {([
            { v: "all" as const, l: "Todas" },
            { v: "calculo-1" as const, l: "Cálculo" },
            { v: "mat-discreta" as const, l: "Discreta" },
          ]).map((d) => (
            <button
              key={d.v}
              onClick={() => setDiscipline(d.v)}
              className={`rounded-sm border px-2 py-0.5 text-[10px] transition-colors ${
                discipline === d.v
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {d.l}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* ═══ NOTAS TAB ═══ */}
        {tab === "notas" && (
          <>
            {/* Notes list */}
            <div className={`${selectedNote ? "w-1/2" : "flex-1"} overflow-y-auto space-y-2`}>
              {/* Sub-filters */}
              <div className="flex items-center gap-2 pb-2">
                <span className="text-[10px] text-fg-muted">Formato:</span>
                {(["all", "cornell", "outline", "concept-map", "summary", "free"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setNoteFilter({ ...noteFilter, format: f })}
                    className={`rounded-sm border px-1.5 py-0.5 text-[10px] transition-colors ${
                      noteFilter.format === f
                        ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                        : "border-border-default text-fg-tertiary hover:text-fg-secondary"
                    }`}
                  >
                    {f === "all" ? "Todos" : formatLabels[f]}
                  </button>
                ))}
                {/* AI generate button */}
                <button
                  onClick={() => handleGenerateAI("notes")}
                  disabled={aiLoading}
                  className="ml-auto rounded-sm border border-accent-primary/30 bg-accent-primary/5 px-2 py-0.5 text-[10px] text-accent-primary hover:bg-accent-primary/10 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? "Gerando..." : "✦ Gerar com IA"}
                </button>
              </div>

              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${
                    selectedNote?.id === note.id
                      ? "border-accent-primary bg-accent-primary/5"
                      : "border-border-default bg-bg-surface hover:border-border-hover"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{formatIcons[note.format]}</span>
                        <h3 className="text-sm font-semibold text-fg-primary truncate">{note.title}</h3>
                      </div>
                      <p className="mt-1 text-xs text-fg-tertiary line-clamp-2">{note.content.slice(0, 120)}...</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-mono text-[10px] text-fg-muted">{note.updatedAt}</span>
                      {note.aiGenerated && <Badge variant="default">IA</Badge>}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Badge variant="outline">{note.disciplineName}</Badge>
                    <span className="text-[10px] text-fg-muted">{note.topicName}</span>
                    <div className="ml-auto flex items-center gap-1">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-sm bg-bg-tertiary px-1 py-0.5 text-[10px] text-fg-muted">
                          #{tag}
                        </span>
                      ))}
                      {note.linkedTopics.length > 0 && (
                        <span className="text-[10px] text-accent-primary">
                          🔗{note.linkedTopics.length}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {notes.length === 0 && (
                <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
                  <p className="text-sm text-fg-tertiary">Nenhuma nota encontrada.</p>
                </div>
              )}
            </div>

            {/* Note detail viewer */}
            {selectedNote && (
              <div className="w-1/2 shrink-0 rounded-md border border-border-default bg-bg-surface overflow-hidden">
                <NoteViewer
                  note={selectedNote}
                  onClose={() => setSelectedNote(null)}
                  onTopicClick={handleTopicClick}
                  onExport={handleExportNote}
                />
              </div>
            )}
          </>
        )}

        {/* ═══ FLASHCARDS TAB ═══ */}
        {tab === "flashcards" && (
          <div className="flex-1 overflow-y-auto">
            {studyMode ? (
              <div className="mx-auto max-w-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-fg-primary">Modo Estudo</h2>
                  <button
                    onClick={() => setStudyMode(false)}
                    className="rounded-sm border border-border-default px-2 py-0.5 text-xs text-fg-tertiary hover:text-fg-secondary"
                  >
                    ← Voltar à lista
                  </button>
                </div>
                <FlashcardDeck
                  cards={flashcards}
                  onComplete={() => {}}
                />
              </div>
            ) : (
              <>
                {/* Sub-filters + actions */}
                <div className="flex items-center gap-2 pb-3">
                  <span className="text-[10px] text-fg-muted">Tipo:</span>
                  {(["all", "definition", "theorem", "procedure", "example"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFcFilter({ ...fcFilter, type: t })}
                      className={`rounded-sm border px-1.5 py-0.5 text-[10px] transition-colors ${
                        fcFilter.type === t
                          ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                          : "border-border-default text-fg-tertiary hover:text-fg-secondary"
                      }`}
                    >
                      {t === "all" ? "Todos" : cardTypeLabels[t]}
                    </button>
                  ))}
                  <button
                    onClick={() => setFcFilter({ ...fcFilter, dueOnly: !fcFilter.dueOnly })}
                    className={`rounded-sm border px-1.5 py-0.5 text-[10px] transition-colors ${
                      fcFilter.dueOnly
                        ? "border-accent-warning bg-accent-warning/10 text-accent-warning"
                        : "border-border-default text-fg-tertiary hover:text-fg-secondary"
                    }`}
                  >
                    Pendentes
                  </button>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => handleGenerateAI("flashcards")}
                      disabled={aiLoading}
                      className="rounded-sm border border-accent-primary/30 bg-accent-primary/5 px-2 py-0.5 text-[10px] text-accent-primary hover:bg-accent-primary/10 transition-colors disabled:opacity-50"
                    >
                      {aiLoading ? "Gerando..." : "✦ Gerar com IA"}
                    </button>
                    <button
                      onClick={handleExportAllFlashcards}
                      className="rounded-sm border border-border-default px-2 py-0.5 text-[10px] text-fg-muted hover:text-fg-secondary"
                    >
                      ↓ Export .md
                    </button>
                    <button
                      onClick={() => setStudyMode(true)}
                      className="rounded-sm border border-accent-primary bg-accent-primary/10 px-3 py-0.5 text-[10px] text-accent-primary hover:bg-accent-primary/20 transition-colors"
                    >
                      ▶ Estudar ({flashcards.length})
                    </button>
                  </div>
                </div>

                {/* Card grid */}
                <div className="grid grid-cols-2 gap-3">
                  {flashcards.map((card) => {
                    const today = new Date().toISOString().slice(0, 10);
                    const isDue = card.nextReview <= today;

                    return (
                      <div
                        key={card.id}
                        className={`rounded-md border p-3 ${
                          isDue
                            ? "border-accent-warning/30 bg-accent-warning/5"
                            : "border-border-default bg-bg-surface"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <Badge variant="outline">{cardTypeLabels[card.type]}</Badge>
                          <span className="text-[10px] text-fg-muted">{card.topicName}</span>
                          <div className="ml-auto flex items-center gap-0.5">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <span key={i} className={`text-[10px] ${i < card.difficulty ? "text-accent-warning" : "text-fg-muted/30"}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-fg-primary">{card.front}</p>
                        <p className="mt-1 text-xs text-fg-tertiary line-clamp-2">{card.back}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-fg-muted">
                          <span>Box {card.srBox}/4</span>
                          <span className={isDue ? "text-accent-warning font-medium" : ""}>
                            {isDue ? "Pendente" : card.nextReview}
                          </span>
                          <span>
                            {card.timesReviewed > 0
                              ? `${((card.timesCorrect / card.timesReviewed) * 100).toFixed(0)}% acerto`
                              : "Novo"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {flashcards.length === 0 && (
                  <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
                    <p className="text-sm text-fg-tertiary">Nenhum flashcard encontrado.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ ORAL TAB ═══ */}
        {tab === "oral" && (
          <div className="flex-1 overflow-y-auto">
            {quizMode ? (
              <div className="mx-auto max-w-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-fg-primary">Quiz Oral</h2>
                  <button
                    onClick={() => setQuizMode(false)}
                    className="rounded-sm border border-border-default px-2 py-0.5 text-xs text-fg-tertiary hover:text-fg-secondary"
                  >
                    ← Voltar à lista
                  </button>
                </div>
                <OralQuiz questions={oralQuestions} />
              </div>
            ) : (
              <>
                {/* Sub-filters + actions */}
                <div className="flex items-center gap-2 pb-3">
                  <span className="text-[10px] text-fg-muted">Dificuldade:</span>
                  {(["all", "easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setOralFilter({ ...oralFilter, difficulty: d })}
                      className={`rounded-sm border px-1.5 py-0.5 text-[10px] transition-colors ${
                        oralFilter.difficulty === d
                          ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                          : "border-border-default text-fg-tertiary hover:text-fg-secondary"
                      }`}
                    >
                      {d === "all" ? "Todos" : difficultyLabels[d]}
                    </button>
                  ))}

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => handleGenerateAI("oral")}
                      disabled={aiLoading}
                      className="rounded-sm border border-accent-primary/30 bg-accent-primary/5 px-2 py-0.5 text-[10px] text-accent-primary hover:bg-accent-primary/10 transition-colors disabled:opacity-50"
                    >
                      {aiLoading ? "Gerando..." : "✦ Gerar com IA"}
                    </button>
                    <button
                      onClick={handleExportAllOral}
                      className="rounded-sm border border-border-default px-2 py-0.5 text-[10px] text-fg-muted hover:text-fg-secondary"
                    >
                      ↓ Export .md
                    </button>
                    <button
                      onClick={() => setQuizMode(true)}
                      className="rounded-sm border border-accent-primary bg-accent-primary/10 px-3 py-0.5 text-[10px] text-accent-primary hover:bg-accent-primary/20 transition-colors"
                    >
                      ▶ Iniciar quiz ({oralQuestions.length})
                    </button>
                  </div>
                </div>

                {/* Questions list */}
                <div className="space-y-2">
                  {oralQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-md border border-border-default bg-bg-surface p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm text-fg-primary">{q.question}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {q.expectedPoints.map((p, i) => (
                              <span key={i} className="rounded-sm bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-fg-muted">
                                ✓ {p.length > 40 ? p.slice(0, 38) + "…" : p}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge
                            variant={q.difficulty === "easy" ? "success" : q.difficulty === "medium" ? "warning" : "danger"}
                          >
                            {difficultyLabels[q.difficulty]}
                          </Badge>
                          <Badge variant="outline">{q.disciplineName}</Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[10px] text-fg-muted">{q.topicName}</span>
                        <div className="ml-auto flex items-center gap-1">
                          {q.relatedConcepts.map((c) => (
                            <span key={c} className="rounded-sm bg-accent-primary/10 px-1 py-0.5 text-[10px] text-accent-primary">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {oralQuestions.length === 0 && (
                  <div className="rounded-md border border-border-default bg-bg-surface p-8 text-center">
                    <p className="text-sm text-fg-tertiary">Nenhuma pergunta oral encontrada.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
