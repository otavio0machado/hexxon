// ============================================================
// NOTES & FLASHCARDS ENGINE
// Filtering, search, spaced repetition, export, statistics
// ============================================================

import {
  seedNotes,
  seedFlashcards,
  seedOralQuestions,
  type StudyNote,
  type StudyFlashcard,
  type OralQuestion,
  type NoteFormat,
  type FlashcardType,
  type OralDifficulty,
  type ContentStatus,
} from "@/data/notes-flashcards";

// ── Getters ──

export function getNotes(): StudyNote[] {
  return seedNotes;
}

export function getFlashcards(): StudyFlashcard[] {
  return seedFlashcards;
}

export function getOralQuestions(): OralQuestion[] {
  return seedOralQuestions;
}

// ── Filtering ──

export interface NoteFilter {
  discipline: "all" | "calculo-1" | "mat-discreta";
  format: NoteFormat | "all";
  status: ContentStatus | "all";
  search: string;
  tag: string | null;
  aiOnly: boolean;
}

export const defaultNoteFilter: NoteFilter = {
  discipline: "all",
  format: "all",
  status: "all",
  search: "",
  tag: null,
  aiOnly: false,
};

export function filterNotes(filter: NoteFilter): StudyNote[] {
  let notes = [...seedNotes];

  if (filter.discipline !== "all") {
    notes = notes.filter((n) => n.disciplineId === filter.discipline);
  }
  if (filter.format !== "all") {
    notes = notes.filter((n) => n.format === filter.format);
  }
  if (filter.status !== "all") {
    notes = notes.filter((n) => n.status === filter.status);
  }
  if (filter.aiOnly) {
    notes = notes.filter((n) => n.aiGenerated);
  }
  if (filter.tag) {
    notes = notes.filter((n) => n.tags.includes(filter.tag!));
  }
  if (filter.search.trim()) {
    const q = filter.search.toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.keyConcepts.some((c) => c.toLowerCase().includes(q)) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// ── Flashcard filtering & spaced repetition ──

export interface FlashcardFilter {
  discipline: "all" | "calculo-1" | "mat-discreta";
  type: FlashcardType | "all";
  dueOnly: boolean;
  search: string;
}

export const defaultFlashcardFilter: FlashcardFilter = {
  discipline: "all",
  type: "all",
  dueOnly: false,
  search: "",
};

export function filterFlashcards(filter: FlashcardFilter): StudyFlashcard[] {
  let cards = [...seedFlashcards];

  if (filter.discipline !== "all") {
    cards = cards.filter((c) => c.disciplineId === filter.discipline);
  }
  if (filter.type !== "all") {
    cards = cards.filter((c) => c.type === filter.type);
  }
  if (filter.dueOnly) {
    const today = new Date().toISOString().slice(0, 10);
    cards = cards.filter((c) => c.nextReview <= today);
  }
  if (filter.search.trim()) {
    const q = filter.search.toLowerCase();
    cards = cards.filter(
      (c) =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Sort: due first, then by box (lower first)
  return cards.sort((a, b) => {
    const today = new Date().toISOString().slice(0, 10);
    const aDue = a.nextReview <= today ? 0 : 1;
    const bDue = b.nextReview <= today ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    return a.srBox - b.srBox;
  });
}

export function getDueCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  return seedFlashcards.filter((c) => c.nextReview <= today).length;
}

/** Calculate next review interval based on Leitner system */
export function getNextReviewDays(box: number): number {
  const intervals = [1, 2, 5, 14, 30];
  return intervals[Math.min(box, intervals.length - 1)];
}

// ── Oral questions filtering ──

export interface OralFilter {
  discipline: "all" | "calculo-1" | "mat-discreta";
  difficulty: OralDifficulty | "all";
  search: string;
}

export const defaultOralFilter: OralFilter = {
  discipline: "all",
  difficulty: "all",
  search: "",
};

export function filterOralQuestions(filter: OralFilter): OralQuestion[] {
  let questions = [...seedOralQuestions];

  if (filter.discipline !== "all") {
    questions = questions.filter((q) => q.disciplineId === filter.discipline);
  }
  if (filter.difficulty !== "all") {
    questions = questions.filter((q) => q.difficulty === filter.difficulty);
  }
  if (filter.search.trim()) {
    const s = filter.search.toLowerCase();
    questions = questions.filter(
      (q) =>
        q.question.toLowerCase().includes(s) ||
        q.relatedConcepts.some((c) => c.toLowerCase().includes(s))
    );
  }

  return questions;
}

// ── Internal link parser ──

/** Parse [[topicId]] links in markdown and return topic IDs */
export function parseInternalLinks(content: string): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(2, -2));
}

/** Convert [[topicId]] to clickable links (returns JSX-friendly format) */
export function renderInternalLinks(content: string): string {
  return content.replace(
    /\[\[([^\]]+)\]\]/g,
    '<a class="internal-link" data-topic="$1">$1</a>'
  );
}

// ── Export ──

export function exportNoteAsMarkdown(note: StudyNote): string {
  const header = [
    `---`,
    `title: "${note.title}"`,
    `discipline: ${note.disciplineName}`,
    `topic: ${note.topicName}`,
    `format: ${note.format}`,
    `tags: [${note.tags.join(", ")}]`,
    `created: ${note.createdAt}`,
    `updated: ${note.updatedAt}`,
    `---`,
    ``,
  ].join("\n");

  // Replace [[id]] with human-readable links
  const body = note.content.replace(/\[\[([^\]]+)\]\]/g, (_, id) => {
    const linkedNote = seedNotes.find((n) => n.topicId === id);
    return linkedNote ? `[${linkedNote.topicName}](#${id})` : `[${id}](#${id})`;
  });

  const footer = [
    ``,
    `---`,
    `**Conceitos-chave:** ${note.keyConcepts.join(", ")}`,
    `**Tópicos relacionados:** ${note.linkedTopics.join(", ")}`,
  ].join("\n");

  return header + body + footer;
}

export function exportFlashcardsAsMarkdown(cards: StudyFlashcard[]): string {
  const lines = [
    `# Flashcards`,
    `Exportado em ${new Date().toISOString().slice(0, 10)}`,
    `Total: ${cards.length} cards`,
    ``,
  ];

  for (const card of cards) {
    lines.push(`## ${card.topicName} (${card.type})`);
    lines.push(`**Pergunta:** ${card.front}`);
    lines.push(`**Resposta:** ${card.back}`);
    lines.push(`Dificuldade: ${"★".repeat(card.difficulty)}${"☆".repeat(3 - card.difficulty)}`);
    lines.push(``);
  }

  return lines.join("\n");
}

export function exportOralQuestionsAsMarkdown(questions: OralQuestion[]): string {
  const lines = [
    `# Perguntas Orais`,
    `Exportado em ${new Date().toISOString().slice(0, 10)}`,
    `Total: ${questions.length} perguntas`,
    ``,
  ];

  for (const q of questions) {
    lines.push(`## [${q.difficulty.toUpperCase()}] ${q.topicName}`);
    lines.push(`**Pergunta:** ${q.question}`);
    lines.push(`**Pontos esperados:**`);
    q.expectedPoints.forEach((p) => lines.push(`- ${p}`));
    lines.push(`**Resposta modelo:** ${q.modelAnswer}`);
    lines.push(``);
  }

  return lines.join("\n");
}

// ── Statistics ──

export interface NotesStats {
  totalNotes: number;
  totalFlashcards: number;
  totalOral: number;
  dueFlashcards: number;
  avgAccuracy: number;
  byDiscipline: Record<string, { notes: number; flashcards: number; oral: number }>;
  allTags: string[];
}

export function getNotesStats(): NotesStats {
  const today = new Date().toISOString().slice(0, 10);

  const totalCorrect = seedFlashcards.reduce((s, c) => s + c.timesCorrect, 0);
  const totalReviewed = seedFlashcards.reduce((s, c) => s + c.timesReviewed, 0);

  const allTags = Array.from(
    new Set([
      ...seedNotes.flatMap((n) => n.tags),
      ...seedFlashcards.flatMap((c) => c.tags),
      ...seedOralQuestions.flatMap((q) => q.tags),
    ])
  ).sort();

  const byDiscipline: Record<string, { notes: number; flashcards: number; oral: number }> = {};
  for (const id of ["calculo-1", "mat-discreta"]) {
    byDiscipline[id] = {
      notes: seedNotes.filter((n) => n.disciplineId === id).length,
      flashcards: seedFlashcards.filter((c) => c.disciplineId === id).length,
      oral: seedOralQuestions.filter((q) => q.disciplineId === id).length,
    };
  }

  return {
    totalNotes: seedNotes.length,
    totalFlashcards: seedFlashcards.length,
    totalOral: seedOralQuestions.length,
    dueFlashcards: seedFlashcards.filter((c) => c.nextReview <= today).length,
    avgAccuracy: totalReviewed > 0 ? totalCorrect / totalReviewed : 0,
    byDiscipline,
    allTags,
  };
}
