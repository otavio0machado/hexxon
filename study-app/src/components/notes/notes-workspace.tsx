"use client";

import {
  BookOpen,
  Eye,
  FilePlus2,
  GripVertical,
  Hash,
  Link as LinkIcon,
  List,
  PanelsTopLeft,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  ContentStatus,
  Discipline,
  Note,
  NoteFormat,
  Topic,
} from "@/lib/supabase";
import { GraphGeneratorModal, type MermaidGraphType } from "./graph-generator-modal";
import { MarkdownPreview } from "./markdown-preview";

type EditorMode = "edit" | "split" | "preview";

interface NoteDraft {
  id?: string;
  title: string;
  content: string;
  topic_id: string;
  discipline_id: string;
  format: NoteFormat;
  status: ContentStatus;
  tags: string[];
  key_concepts: string[];
}

type SavePayload = NoteDraft;

function buildBlankDraft(
  disciplines: Discipline[],
  topics: Topic[],
  preferredDisciplineId?: string,
): NoteDraft {
  const disciplineId =
    preferredDisciplineId && preferredDisciplineId !== "all"
      ? preferredDisciplineId
      : disciplines[0]?.id ?? "";
  const topicId =
    topics.find((topic) => topic.discipline_id === disciplineId)?.id ?? "";

  return {
    title: "Nova nota",
    content: "",
    topic_id: topicId,
    discipline_id: disciplineId,
    format: "free",
    status: "draft",
    tags: [],
    key_concepts: [],
  };
}

function noteToDraft(note: Note): NoteDraft {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    topic_id: note.topic_id,
    discipline_id: note.discipline_id,
    format: note.format,
    status: note.status,
    tags: note.tags,
    key_concepts: note.key_concepts,
  };
}

function snapshotDraft(draft: NoteDraft) {
  return JSON.stringify({
    title: draft.title,
    content: draft.content,
    topic_id: draft.topic_id,
    discipline_id: draft.discipline_id,
    format: draft.format,
    status: draft.status,
    tags: draft.tags,
    key_concepts: draft.key_concepts,
  });
}

export function NotesWorkspace({
  notes,
  disciplines,
  topics,
  preferredDisciplineId,
  search,
  onSearchChange,
  onSaveNote,
  onDeleteNote,
  onToast,
}: {
  notes: Note[];
  disciplines: Discipline[];
  topics: Topic[];
  preferredDisciplineId: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSaveNote: (payload: SavePayload) => Promise<Note>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onToast: (message: string, type?: "success" | "error") => void;
}) {
  const [editorMode, setEditorMode] = useState<EditorMode>("split");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id ?? null);
  const [draft, setDraft] = useState<NoteDraft>(() =>
    notes[0]
      ? noteToDraft(notes[0])
      : buildBlankDraft(disciplines, topics, preferredDisciplineId),
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshotDraft(draft));
  const [saving, setSaving] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [graphGenerating, setGraphGenerating] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [noteFilters, setNoteFilters] = useState({
    format: "all",
    status: "all",
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cursorRef = useRef({ start: 0, end: 0 });

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (preferredDisciplineId !== "all" && note.discipline_id !== preferredDisciplineId) {
        return false;
      }
      if (noteFilters.format !== "all" && note.format !== noteFilters.format) {
        return false;
      }
      if (noteFilters.status !== "all" && note.status !== noteFilters.status) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [noteFilters.format, noteFilters.status, notes, preferredDisciplineId, search]);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? null,
    [activeNoteId, notes],
  );

  const draftTopics = useMemo(
    () =>
      topics.filter((topic) =>
        draft.discipline_id ? topic.discipline_id === draft.discipline_id : true,
      ),
    [draft.discipline_id, topics],
  );

  const isDirty = snapshotDraft(draft) !== savedSnapshot;

  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      const fallback = filteredNotes[0] ?? notes[0];
      if (fallback) {
        setActiveNoteId(fallback.id);
        const nextDraft = noteToDraft(fallback);
        setDraft(nextDraft);
        setSavedSnapshot(snapshotDraft(nextDraft));
      }
    }
  }, [activeNoteId, filteredNotes, notes]);

  useEffect(() => {
    if (!activeNoteId && notes.length === 0) {
      const blank = buildBlankDraft(disciplines, topics, preferredDisciplineId);
      setDraft(blank);
      setSavedSnapshot(snapshotDraft(blank));
      return;
    }

    if (activeNote) {
      const nextDraft = noteToDraft(activeNote);
      setDraft(nextDraft);
      setSavedSnapshot(snapshotDraft(nextDraft));
    }
  }, [activeNote, activeNoteId, disciplines, notes.length, preferredDisciplineId, topics]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function syncCursor() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    cursorRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  }

  function safelySwitchNote(note: Note) {
    if (isDirty && !window.confirm("Existem alterações não salvas. Deseja descartá-las?")) {
      return;
    }

    setActiveNoteId(note.id);
  }

  function handleCreateNote() {
    if (isDirty && !window.confirm("Existem alterações não salvas. Deseja descartá-las e criar uma nova nota?")) {
      return;
    }

    const blank = buildBlankDraft(disciplines, topics, preferredDisciplineId);
    setActiveNoteId(null);
    setDraft(blank);
    setSavedSnapshot(snapshotDraft(blank));
    setGraphError(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function updateDraft<K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: value };

      if (key === "discipline_id") {
        const firstTopic =
          topics.find((topic) => topic.discipline_id === value)?.id ?? "";
        next.topic_id = firstTopic;
      }

      return next;
    });
  }

  async function handleSave() {
    if (!draft.title.trim()) {
      onToast("Defina um título para a nota.", "error");
      return;
    }

    if (!draft.topic_id) {
      onToast("Selecione um tópico para a nota.", "error");
      return;
    }

    setSaving(true);
    try {
      const saved = await onSaveNote({
        ...draft,
        title: draft.title.trim(),
        content: draft.content,
      });

      const nextDraft = noteToDraft(saved);
      setActiveNoteId(saved.id);
      setDraft(nextDraft);
      setSavedSnapshot(snapshotDraft(nextDraft));
      onToast("Nota salva com sucesso.");
    } catch (error) {
      onToast(
        error instanceof Error ? error.message : "Erro ao salvar nota.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!activeNoteId) {
      onToast("A nota ainda não foi salva.", "error");
      return;
    }

    if (!window.confirm("Tem certeza que deseja deletar esta nota?")) {
      return;
    }

    try {
      await onDeleteNote(activeNoteId);
      const fallback = filteredNotes.find((note) => note.id !== activeNoteId) ?? notes.find((note) => note.id !== activeNoteId) ?? null;
      setActiveNoteId(fallback?.id ?? null);
      if (!fallback) {
        const blank = buildBlankDraft(disciplines, topics, preferredDisciplineId);
        setDraft(blank);
        setSavedSnapshot(snapshotDraft(blank));
      }
    } catch (error) {
      onToast(
        error instanceof Error ? error.message : "Erro ao deletar nota.",
        "error",
      );
    }
  }

  function insertAtCursor(insertion: string) {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : cursorRef.current.start;
    const end = textarea ? textarea.selectionEnd : cursorRef.current.end;

    setDraft((current) => {
      const nextContent =
        current.content.slice(0, start) + insertion + current.content.slice(end);
      return {
        ...current,
        content: nextContent,
      };
    });

    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const cursorPosition = start + insertion.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      cursorRef.current = { start: cursorPosition, end: cursorPosition };
    });
  }

  function insertMarkdown(wrapperBefore: string, wrapperAfter = "") {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : cursorRef.current.start;
    const end = textarea ? textarea.selectionEnd : cursorRef.current.end;
    const selected = draft.content.slice(start, end);
    const insertion = `${wrapperBefore}${selected}${wrapperAfter}`;
    insertAtCursor(insertion);
  }

  async function handleGenerateGraph({
    graphType,
    request,
  }: {
    graphType: MermaidGraphType;
    request: string;
  }) {
    setGraphGenerating(true);
    setGraphError(null);

    try {
      const disciplineName =
        disciplines.find((discipline) => discipline.id === draft.discipline_id)?.name;
      const topicName = topics.find((topic) => topic.id === draft.topic_id)?.name;

      const response = await fetch("/api/ai/note-graph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          graphType,
          request,
          noteContent: draft.content,
          courseName: disciplineName,
          topicName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message ?? "Falha ao gerar gráfico.");
      }

      const result = data.data as {
        title: string;
        mermaid: string;
        explanation: string;
      };

      const block = [
        "",
        `## ${result.title}`,
        "",
        "```mermaid",
        result.mermaid.trim(),
        "```",
        "",
        `> ${result.explanation}`,
        "",
      ].join("\n");

      insertAtCursor(block);
      setGraphModalOpen(false);
      onToast("Gráfico gerado e inserido na nota.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao gerar gráfico.";
      setGraphError(message);
      onToast(message, "error");
    } finally {
      setGraphGenerating(false);
    }
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-12 gap-4">
      <aside className="col-span-3 flex min-h-0 flex-col rounded-2xl border border-border-default bg-bg-surface">
        <div className="border-b border-border-default p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fg-muted">
                Vault
              </p>
              <h2 className="mt-1 text-lg font-semibold text-fg-primary">Notas</h2>
            </div>
            <button
              onClick={handleCreateNote}
              type="button"
              className="rounded-xl bg-accent-primary px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <span className="flex items-center gap-2">
                <FilePlus2 className="h-4 w-4" />
                Nova
              </span>
            </button>
          </div>

          <div className="space-y-2">
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar na vault..."
              className="w-full rounded-xl border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary outline-none placeholder:text-fg-muted"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={noteFilters.format}
                onChange={(event) =>
                  setNoteFilters((current) => ({
                    ...current,
                    format: event.target.value,
                  }))
                }
                className="rounded-xl border border-border-default bg-bg-primary px-3 py-2 text-xs text-fg-secondary outline-none"
              >
                <option value="all">Formato</option>
                <option value="cornell">Cornell</option>
                <option value="outline">Outline</option>
                <option value="concept_map">Mapa</option>
                <option value="summary">Resumo</option>
                <option value="free">Livre</option>
              </select>

              <select
                value={noteFilters.status}
                onChange={(event) =>
                  setNoteFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                className="rounded-xl border border-border-default bg-bg-primary px-3 py-2 text-xs text-fg-secondary outline-none"
              >
                <option value="all">Status</option>
                <option value="draft">Rascunho</option>
                <option value="review">Revisão</option>
                <option value="done">Pronto</option>
              </select>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {filteredNotes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <BookOpen className="h-10 w-10 text-fg-muted/30" />
              <p className="text-sm text-fg-tertiary">Nenhuma nota encontrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotes.map((note) => {
                const discipline = disciplines.find(
                  (disciplineEntry) => disciplineEntry.id === note.discipline_id,
                );
                const isActive = note.id === activeNoteId;

                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => safelySwitchNote(note)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-colors",
                      isActive
                        ? "border-accent-primary bg-accent-primary/10"
                        : "border-border-default bg-bg-primary hover:bg-bg-secondary",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg-primary">
                          {note.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-fg-tertiary">
                          {discipline?.name ?? "Disciplina"}
                        </p>
                      </div>
                      <span className="text-[11px] uppercase tracking-wider text-fg-muted">
                        {note.format}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-fg-secondary">
                      {note.content}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <section className="col-span-9 flex min-h-0 flex-col rounded-2xl border border-border-default bg-bg-surface">
        <div className="border-b border-border-default p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <input
                value={draft.title}
                onChange={(event) => updateDraft("title", event.target.value)}
                placeholder="Título da nota"
                className="w-full bg-transparent text-2xl font-semibold tracking-tight text-fg-primary outline-none placeholder:text-fg-muted"
              />

              <div className="grid gap-2 md:grid-cols-4">
                <select
                  value={draft.discipline_id}
                  onChange={(event) => updateDraft("discipline_id", event.target.value)}
                  className="rounded-xl border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary outline-none"
                >
                  {disciplines.map((discipline) => (
                    <option key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </option>
                  ))}
                </select>

                <select
                  value={draft.topic_id}
                  onChange={(event) => updateDraft("topic_id", event.target.value)}
                  className="rounded-xl border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary outline-none"
                >
                  {draftTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>

                <select
                  value={draft.format}
                  onChange={(event) => updateDraft("format", event.target.value as NoteFormat)}
                  className="rounded-xl border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary outline-none"
                >
                  <option value="free">Livre</option>
                  <option value="cornell">Cornell</option>
                  <option value="outline">Outline</option>
                  <option value="concept_map">Mapa Conceitual</option>
                  <option value="summary">Resumo</option>
                </select>

                <select
                  value={draft.status}
                  onChange={(event) => updateDraft("status", event.target.value as ContentStatus)}
                  className="rounded-xl border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary outline-none"
                >
                  <option value="draft">Rascunho</option>
                  <option value="review">Em revisão</option>
                  <option value="done">Pronto</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ViewModeButton
                active={editorMode === "edit"}
                onClick={() => setEditorMode("edit")}
                icon={<GripVertical className="h-4 w-4" />}
                label="Editor"
              />
              <ViewModeButton
                active={editorMode === "split"}
                onClick={() => setEditorMode("split")}
                icon={<PanelsTopLeft className="h-4 w-4" />}
                label="Split"
              />
              <ViewModeButton
                active={editorMode === "preview"}
                onClick={() => setEditorMode("preview")}
                icon={<Eye className="h-4 w-4" />}
                label="Preview"
              />
              <button
                type="button"
                onClick={() => setGraphModalOpen(true)}
                className="rounded-xl border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary transition-colors hover:bg-bg-secondary"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Gerar gráfico
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-xl bg-accent-primary px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="rounded-xl border border-accent-danger/30 bg-accent-danger/5 px-3 py-2 text-sm text-accent-danger transition-colors hover:bg-accent-danger/10"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <ToolbarButton label="H2" onClick={() => insertAtCursor("## ")} />
            <ToolbarButton label="Lista" onClick={() => insertAtCursor("- ")} />
            <ToolbarButton label="Negrito" onClick={() => insertMarkdown("**", "**")} />
            <ToolbarButton label="Link" onClick={() => insertMarkdown("[", "](https://)")} />
            <ToolbarButton label="Código" onClick={() => insertMarkdown("`", "`")} />
            <ToolbarButton
              label="Callout"
              onClick={() => insertAtCursor("> [!note]\n> ")}
            />
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <input
              value={draft.tags.join(", ")}
              onChange={(event) =>
                updateDraft(
                  "tags",
                  event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                )
              }
              placeholder="tags separadas por vírgula"
              className="rounded-xl border border-border-default bg-bg-primary px-3 py-2 text-sm text-fg-primary outline-none placeholder:text-fg-muted"
            />
            <div className="flex items-center justify-between rounded-xl border border-border-default bg-bg-primary px-3 py-2 text-sm">
              <span className="text-fg-tertiary">
                {isDirty ? "Alterações não salvas" : "Tudo salvo"}
              </span>
              <span className="text-fg-muted">
                {draft.content.length} caracteres
              </span>
            </div>
          </div>

          {graphError && (
            <div className="mt-4 rounded-xl border border-accent-danger/30 bg-accent-danger/5 px-3 py-2 text-sm text-accent-danger">
              {graphError}
            </div>
          )}
        </div>

        <div
          className={cn(
            "grid min-h-0 flex-1 gap-0",
            editorMode === "split" ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {editorMode !== "preview" && (
            <div className="min-h-0 border-r border-border-default bg-[#15161a]">
              <textarea
                ref={textareaRef}
                value={draft.content}
                onChange={(event) => updateDraft("content", event.target.value)}
                onClick={syncCursor}
                onKeyUp={syncCursor}
                onSelect={syncCursor}
                placeholder="# Comece sua nota aqui

Use markdown normalmente.

Você pode clicar em “Gerar gráfico” para pedir um Mermaid e inserir no ponto do cursor."
                className="h-full min-h-0 w-full resize-none bg-transparent px-5 py-5 font-mono text-[15px] leading-7 text-[#e9e7df] outline-none placeholder:text-[#6e717a]"
                spellCheck={false}
              />
            </div>
          )}

          {editorMode !== "edit" && (
            <div className="min-h-0 overflow-y-auto bg-bg-primary p-5">
              <MarkdownPreview content={draft.content || "_Pré-visualização vazia._"} />
            </div>
          )}
        </div>
      </section>

      {graphModalOpen && (
        <GraphGeneratorModal
          loading={graphGenerating}
          onClose={() => {
            if (graphGenerating) return;
            setGraphModalOpen(false);
          }}
          onGenerate={handleGenerateGraph}
        />
      )}
    </div>
  );
}

function ViewModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm transition-colors",
        active
          ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
          : "border-border-default bg-bg-primary text-fg-secondary hover:bg-bg-secondary",
      )}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}

function ToolbarButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  const icon =
    label === "H2" ? <Hash className="h-3.5 w-3.5" /> :
    label === "Lista" ? <List className="h-3.5 w-3.5" /> :
    label === "Link" ? <LinkIcon className="h-3.5 w-3.5" /> :
    <span className="font-medium">{label}</span>;

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border-default bg-bg-primary px-3 py-1.5 text-xs text-fg-secondary transition-colors hover:bg-bg-secondary hover:text-fg-primary"
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}
