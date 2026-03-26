// ============================================================
// EXAM PREP ENGINE — Lógica de preparação para provas
// Priorização, contagem regressiva, detecção de modo, cálculos
// ============================================================

import type { Assessment, ExamTopic, PrepMode } from "@/data/exam-data";
import type { MasteryLevel } from "@/data/mock";

// ── Constantes ──

const MASTERY_WEIGHTS: Record<MasteryLevel, number> = {
  none: 0,
  exposed: 0.2,
  developing: 0.5,
  proficient: 0.8,
  mastered: 1.0,
};

const FINAL_REVIEW_THRESHOLD_HOURS = 48;

// ── Contagem regressiva ──

export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function hoursUntil(dateStr: string): number {
  return (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60);
}

export function formatCountdown(days: number): string {
  if (days < 0) return `${Math.abs(days)}d atrás`;
  if (days === 0) return "HOJE";
  if (days === 1) return "AMANHÃ";
  if (days <= 7) return `${days} dias`;
  const weeks = Math.floor(days / 7);
  const rest = days % 7;
  return rest > 0 ? `${weeks}sem ${rest}d` : `${weeks} semanas`;
}

export function urgencyLevel(days: number): "critical" | "high" | "medium" | "low" {
  if (days <= 2) return "critical";
  if (days <= 7) return "high";
  if (days <= 14) return "medium";
  return "low";
}

export function urgencyColor(level: "critical" | "high" | "medium" | "low"): string {
  return {
    critical: "text-accent-danger",
    high: "text-accent-warning",
    medium: "text-mastery-exposed",
    low: "text-fg-tertiary",
  }[level];
}

export function urgencyBg(level: "critical" | "high" | "medium" | "low"): string {
  return {
    critical: "bg-accent-danger/10 border-accent-danger/30",
    high: "bg-accent-warning/10 border-accent-warning/30",
    medium: "bg-mastery-exposed/10 border-mastery-exposed/30",
    low: "bg-bg-surface border-border-default",
  }[level];
}

// ── Detecção de modo ──

export function detectPrepMode(exam: Assessment): PrepMode {
  if (exam.status === "completed" || exam.score !== null) return "post-exam";
  const hours = hoursUntil(exam.date);
  if (hours <= FINAL_REVIEW_THRESHOLD_HOURS && hours > 0) return "final-review";
  if (hours <= 0) return "post-exam";
  return "planning";
}

// ── Priorização de tópicos ──

export function prioritizeTopics(topics: ExamTopic[], daysLeft: number): ExamTopic[] {
  return topics
    .map((t) => {
      // Fatores: (1-mastery) * urgência * cobertura_exercícios
      const masteryGap = 1 - MASTERY_WEIGHTS[t.mastery];
      const urgencyMult = daysLeft <= 3 ? 2.0 : daysLeft <= 7 ? 1.5 : 1.0;
      const coverageGap = t.exercisesAvailable > 0
        ? 1 - (t.exercisesAttempted / t.exercisesAvailable)
        : 0.5; // sem exercícios = risco médio

      const priority = Math.round(masteryGap * 50 + coverageGap * 30 * urgencyMult + (1 - t.score) * 20);
      return { ...t, priority: Math.min(100, priority) };
    })
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

// ── Cobertura da prova ──

export function examCoverage(exam: Assessment): {
  coveragePct: number;
  mastered: number;
  developing: number;
  weak: number;
  unseen: number;
  avgScore: number;
} {
  const topics = exam.topics;
  const total = topics.length;
  if (total === 0) return { coveragePct: 0, mastered: 0, developing: 0, weak: 0, unseen: 0, avgScore: 0 };

  const mastered = topics.filter((t) => t.mastery === "mastered" || t.mastery === "proficient").length;
  const developing = topics.filter((t) => t.mastery === "developing").length;
  const weak = topics.filter((t) => t.mastery === "exposed").length;
  const unseen = topics.filter((t) => t.mastery === "none").length;

  const avgScore = topics.reduce((sum, t) => sum + t.score, 0) / total;
  const coveragePct = Math.round(((mastered * 1 + developing * 0.6 + weak * 0.2) / total) * 100);

  return { coveragePct, mastered, developing, weak, unseen, avgScore };
}

// ── Estimativa de nota na prova ──

export function estimateExamGrade(exam: Assessment): number {
  const topics = exam.topics;
  if (topics.length === 0) return 0;
  const weightedScore = topics.reduce((sum, t) => sum + MASTERY_WEIGHTS[t.mastery] * 10, 0);
  return Math.round((weightedScore / topics.length) * 10) / 10;
}

// ── Cálculo de G1 ──

export function calculateG1(scores: { p1: number | null; p2: number | null; p3: number | null; mt: number | null }): number | null {
  const { p1, p2, p3, mt } = scores;
  if (p1 === null || p2 === null || p3 === null || mt === null) return null;
  return Math.round(((p1 + p2 + p3 + mt) / 4) * 10) / 10;
}

export function neededForApproval(current: { p1?: number; p2?: number; mt?: number }, target: number = 7.0): {
  neededP2?: number;
  neededP3?: number;
  message: string;
} {
  // G1 = (P1 + P2 + P3 + MT) / 4 >= target
  // P1 + P2 + P3 + MT >= target * 4
  const known = (current.p1 ?? 0) + (current.p2 ?? 0) + (current.mt ?? 0);
  const knownCount = [current.p1, current.p2, current.mt].filter((v) => v !== undefined).length;
  const remaining = 3 - knownCount; // quantas provas faltam

  if (remaining <= 0) {
    return { message: "Todas as notas já estão definidas." };
  }

  const needed = (target * 4 - known) / remaining;
  const clamped = Math.min(10, Math.max(0, Math.ceil(needed * 10) / 10));

  if (clamped > 10) {
    return { message: `Impossível atingir ${target} com G1. Precisará de G2.` };
  }

  return {
    neededP3: remaining >= 1 ? clamped : undefined,
    neededP2: remaining >= 2 ? clamped : undefined,
    message: `Precisa tirar pelo menos ${clamped.toFixed(1)} nas próximas ${remaining} avaliação(ões).`,
  };
}

// ── Próximas avaliações ──

export function getUpcomingAssessments(assessments: Assessment[]): Assessment[] {
  return assessments
    .filter((a) => a.status === "upcoming" && daysUntil(a.date) >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getNextExam(assessments: Assessment[]): Assessment | null {
  const upcoming = getUpcomingAssessments(assessments);
  return upcoming.find((a) => a.type === "prova" || a.type === "ps") ?? upcoming[0] ?? null;
}

// ── Checklist de revisão final ──

export interface ReviewCheckItem {
  id: string;
  label: string;
  topicName: string;
  type: "weak-topic" | "unseen-topic" | "error-pattern" | "practice" | "rest";
  checked: boolean;
  priority: "critical" | "high" | "medium";
}

export function generateFinalReviewChecklist(exam: Assessment): ReviewCheckItem[] {
  const items: ReviewCheckItem[] = [];

  // Tópicos não vistos = críticos
  exam.topics
    .filter((t) => t.mastery === "none")
    .forEach((t) => {
      items.push({
        id: `unseen-${t.id}`,
        label: `Estudar ${t.name} (nunca visto)`,
        topicName: t.name,
        type: "unseen-topic",
        checked: false,
        priority: "critical",
      });
    });

  // Tópicos fracos
  exam.topics
    .filter((t) => t.mastery === "exposed")
    .forEach((t) => {
      items.push({
        id: `weak-${t.id}`,
        label: `Reforçar ${t.name} (score: ${(t.score * 10).toFixed(0)}/10)`,
        topicName: t.name,
        type: "weak-topic",
        checked: false,
        priority: "high",
      });
    });

  // Prática dos "developing"
  exam.topics
    .filter((t) => t.mastery === "developing")
    .forEach((t) => {
      items.push({
        id: `practice-${t.id}`,
        label: `Fazer exercícios de ${t.name}`,
        topicName: t.name,
        type: "practice",
        checked: false,
        priority: "medium",
      });
    });

  // Descanso
  items.push({
    id: "rest",
    label: "Dormir pelo menos 7h na noite anterior",
    topicName: "",
    type: "rest",
    checked: false,
    priority: "high",
  });

  return items;
}

// ── Tempo estimado por simulado ──

export function estimateSimulationTime(exam: Assessment): number {
  // ~10min por tópico de prova + overhead
  return Math.max(60, exam.topics.length * 10 + 15);
}
