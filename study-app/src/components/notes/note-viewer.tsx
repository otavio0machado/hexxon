"use client";

import { Badge } from "@/components/ui/badge";
import type { StudyNote } from "@/data/notes-flashcards";
import { formatLabels, formatIcons, statusLabels } from "@/data/notes-flashcards";

interface Props {
  note: StudyNote;
  onClose: () => void;
  onTopicClick: (topicId: string) => void;
  onExport: (note: StudyNote) => void;
}

/** Renders markdown-like content with internal links */
function renderContent(content: string, onTopicClick: (topicId: string) => void) {
  // Split content by [[topicId]] pattern
  const parts = content.split(/(\[\[[^\]]+\]\])/g);

  return parts.map((part, i) => {
    const match = part.match(/^\[\[([^\]]+)\]\]$/);
    if (match) {
      return (
        <button
          key={i}
          onClick={() => onTopicClick(match[1])}
          className="inline-flex items-center gap-0.5 rounded-sm bg-accent-primary/10 px-1 py-0.5 text-accent-primary hover:bg-accent-primary/20 transition-colors"
        >
          <span className="text-[10px]">🔗</span>
          <span>{match[1]}</span>
        </button>
      );
    }
    // Simple markdown rendering for headers, bold, and lists
    return <span key={i}>{part}</span>;
  });
}

export function NoteViewer({ note, onClose, onTopicClick, onExport }: Props) {
  const lines = note.content.split("\n");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border-default p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{formatIcons[note.format]}</span>
            <Badge variant="outline">{formatLabels[note.format]}</Badge>
            <Badge variant={note.status === "done" ? "success" : note.status === "review" ? "warning" : "default"}>
              {statusLabels[note.status]}
            </Badge>
            {note.aiGenerated && (
              <Badge variant="default">IA</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onExport(note)}
              className="rounded-sm px-2 py-1 text-[10px] text-fg-muted hover:bg-bg-secondary hover:text-fg-secondary transition-colors"
              title="Exportar .md"
            >
              ↓ Export
            </button>
            <button
              onClick={onClose}
              className="text-fg-muted hover:text-fg-secondary text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
        <h2 className="mt-2 text-lg font-semibold text-fg-primary">{note.title}</h2>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-fg-muted">
          <span>{note.disciplineName}</span>
          <span>·</span>
          <span>{note.topicName}</span>
          <span>·</span>
          <span>Atualizado {note.updatedAt}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="prose-note space-y-1 text-sm text-fg-secondary leading-relaxed whitespace-pre-wrap font-mono">
          {lines.map((line, i) => {
            // Headers
            if (line.startsWith("# ")) {
              return <h1 key={i} className="text-lg font-bold text-fg-primary mt-4 mb-1 font-sans">{line.slice(2)}</h1>;
            }
            if (line.startsWith("## ")) {
              return <h2 key={i} className="text-base font-semibold text-fg-primary mt-3 mb-1 font-sans">{line.slice(3)}</h2>;
            }
            if (line.startsWith("- ")) {
              return (
                <div key={i} className="flex gap-2 pl-2">
                  <span className="text-fg-muted">•</span>
                  <span className="font-sans text-sm">{renderContent(line.slice(2), onTopicClick)}</span>
                </div>
              );
            }
            if (line.startsWith("|")) {
              return <div key={i} className="text-xs text-fg-tertiary">{line}</div>;
            }
            if (line.trim() === "") {
              return <div key={i} className="h-2" />;
            }
            return (
              <p key={i} className="font-sans text-sm">
                {renderContent(line, onTopicClick)}
              </p>
            );
          })}
        </div>
      </div>

      {/* Footer — concepts + linked topics */}
      <div className="border-t border-border-default p-4 space-y-2">
        {note.keyConcepts.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-muted">Conceitos-chave</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {note.keyConcepts.map((c) => (
                <span key={c} className="rounded-sm bg-accent-primary/10 px-1.5 py-0.5 text-[10px] text-accent-primary">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
        {note.linkedTopics.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-muted">Tópicos ligados</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {note.linkedTopics.map((t) => (
                <button
                  key={t}
                  onClick={() => onTopicClick(t)}
                  className="rounded-sm bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-fg-secondary hover:bg-bg-secondary transition-colors"
                >
                  🔗 {t}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span key={tag} className="rounded-sm bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-fg-muted">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
