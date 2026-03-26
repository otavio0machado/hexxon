"use client";

import type { NotesStats } from "@/lib/notes-flashcards";

interface Props {
  stats: NotesStats;
}

export function NotesStatsBar({ stats }: Props) {
  return (
    <div className="grid grid-cols-5 gap-px rounded-md border border-border-default bg-border-default overflow-hidden">
      <div className="bg-bg-surface p-3 text-center">
        <span className="block text-xl font-mono font-semibold text-fg-primary">{stats.totalNotes}</span>
        <span className="text-[10px] text-fg-muted">Notas</span>
      </div>
      <div className="bg-bg-surface p-3 text-center">
        <span className="block text-xl font-mono font-semibold text-fg-primary">{stats.totalFlashcards}</span>
        <span className="text-[10px] text-fg-muted">Flashcards</span>
      </div>
      <div className="bg-bg-surface p-3 text-center">
        <span className="block text-xl font-mono font-semibold text-fg-primary">{stats.totalOral}</span>
        <span className="text-[10px] text-fg-muted">Orais</span>
      </div>
      <div className="bg-bg-surface p-3 text-center">
        <span className={`block text-xl font-mono font-semibold ${stats.dueFlashcards > 0 ? "text-accent-warning" : "text-accent-success"}`}>
          {stats.dueFlashcards}
        </span>
        <span className="text-[10px] text-fg-muted">Pendentes</span>
      </div>
      <div className="bg-bg-surface p-3 text-center">
        <span className="block text-xl font-mono font-semibold text-fg-primary">
          {(stats.avgAccuracy * 100).toFixed(0)}%
        </span>
        <span className="text-[10px] text-fg-muted">Precisão</span>
      </div>
    </div>
  );
}
