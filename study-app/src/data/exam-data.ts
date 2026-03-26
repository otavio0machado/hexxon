// ============================================================
// EXAM DATA — Dados reais extraídos dos cronogramas PUCRS 2026/1
// ============================================================

import type { MasteryLevel } from "./mock";

// ── Types ──

export type AssessmentType = "prova" | "trabalho" | "ps" | "g2";
export type ExamStatus = "upcoming" | "ready" | "completed";
export type PrepMode = "planning" | "final-review" | "simulation" | "post-exam";

export interface ExamTopic {
  id: string;
  name: string;
  moduleId: string;
  moduleName: string;
  mastery: MasteryLevel;
  score: number;
  exercisesAttempted: number;
  exercisesAvailable: number;
  /** Prioridade calculada 0-100 (maior = mais urgente) */
  priority?: number;
}

export interface Assessment {
  id: string;
  disciplineId: string;
  disciplineName: string;
  type: AssessmentType;
  name: string;
  date: string;
  weight: number;
  topics: ExamTopic[];
  moduleIds: string[];
  isCumulative: boolean;
  status: ExamStatus;
  score: number | null;
}

export interface Discipline {
  id: string;
  code: string;
  name: string;
  professor: string;
  schedule: string;
  gradingFormula: string;
  approvalCriteria: string;
}

export interface SimulationQuestion {
  id: string;
  topicId: string;
  topicName: string;
  statement: string;
  type: "multiple-choice" | "open-ended" | "computation";
  options?: { label: string; text: string; isCorrect: boolean }[];
  solution: string;
  hints: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  timeEstimateMin: number;
}

export interface SimulationResult {
  examId: string;
  date: string;
  totalQuestions: number;
  correct: number;
  score: number;
  timeUsedMin: number;
  timeLimitMin: number;
  byTopic: { topicId: string; topicName: string; correct: number; total: number; score: number }[];
  errors: { questionId: string; topicId: string; errorClass: string; explanation: string }[];
}

export interface PostExamAnalysis {
  examId: string;
  actualScore: number;
  expectedScore: number;
  topicBreakdown: { topicName: string; performance: "above" | "expected" | "below"; note: string }[];
  errorsAnalysis: { class: string; count: number; recommendation: string }[];
  nextSteps: string[];
  g1Impact: { current: number; needed: number; isOnTrack: boolean };
}

// ── Disciplines ──

export const disciplines: Discipline[] = [
  {
    id: "calculo-1",
    code: "95300",
    name: "Cálculo I",
    professor: "Daniela Rodrigues",
    schedule: "3ª e 5ª — LM (manhã)",
    gradingFormula: "G1 = (P1 + P2 + P3 + MT) / 4",
    approvalCriteria: "Freq ≥ 75% E (G1 ≥ 7.0) OU (G1 ≥ 4.0 E (G1+G2)/2 ≥ 5.0)",
  },
  {
    id: "mat-discreta",
    code: "95303",
    name: "Matemática Discreta",
    professor: "Karina Benato",
    schedule: "2ª e 4ª — LM (manhã)",
    gradingFormula: "G1 = (P1 + P2 + P3 + MT) / 4",
    approvalCriteria: "Freq ≥ 75% E (G1 ≥ 7.0) OU (G1 ≥ 4.0 E (G1+G2)/2 ≥ 5.0)",
  },
];

// ── Topics por disciplina (com mastery mock realista) ──

const calcTopics: ExamTopic[] = [
  { id: "calc1-t01", name: "Conceito de função", moduleId: "calc1-mod1", moduleName: "Funções e Modelos", mastery: "proficient", score: 0.78, exercisesAttempted: 14, exercisesAvailable: 18 },
  { id: "calc1-t02", name: "Domínio, imagem e gráfico", moduleId: "calc1-mod1", moduleName: "Funções e Modelos", mastery: "proficient", score: 0.72, exercisesAttempted: 12, exercisesAvailable: 15 },
  { id: "calc1-t03", name: "Função afim e quadrática", moduleId: "calc1-mod1", moduleName: "Funções e Modelos", mastery: "developing", score: 0.58, exercisesAttempted: 8, exercisesAvailable: 12 },
  { id: "calc1-t04", name: "Operações e composição", moduleId: "calc1-mod1", moduleName: "Funções e Modelos", mastery: "developing", score: 0.45, exercisesAttempted: 5, exercisesAvailable: 10 },
  { id: "calc1-t05", name: "Funções importantes", moduleId: "calc1-mod1", moduleName: "Funções e Modelos", mastery: "exposed", score: 0.30, exercisesAttempted: 3, exercisesAvailable: 8 },
  { id: "calc1-t06", name: "Trigonométricas", moduleId: "calc1-mod1", moduleName: "Funções e Modelos", mastery: "exposed", score: 0.25, exercisesAttempted: 2, exercisesAvailable: 10 },
  { id: "calc1-t07", name: "Inversa, exp e log", moduleId: "calc1-mod1", moduleName: "Funções e Modelos", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 8 },
  // Módulo 2 — Limites
  { id: "calc1-t08", name: "Limites — conceito", moduleId: "calc1-mod2", moduleName: "Limites e Taxas", mastery: "developing", score: 0.42, exercisesAttempted: 4, exercisesAvailable: 8 },
  { id: "calc1-t09", name: "Cálculo de limites", moduleId: "calc1-mod2", moduleName: "Limites e Taxas", mastery: "exposed", score: 0.28, exercisesAttempted: 2, exercisesAvailable: 8 },
  { id: "calc1-t10", name: "Limites no infinito", moduleId: "calc1-mod2", moduleName: "Limites e Taxas", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 6 },
  // Módulo 3 — Derivadas
  { id: "calc1-t11", name: "Definição de derivada", moduleId: "calc1-mod3", moduleName: "Derivadas", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 0 },
  { id: "calc1-t12", name: "Regras de derivação", moduleId: "calc1-mod3", moduleName: "Derivadas", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 0 },
  { id: "calc1-t13", name: "L'Hôpital", moduleId: "calc1-mod3", moduleName: "Derivadas", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 0 },
  { id: "calc1-t14", name: "Análise de função", moduleId: "calc1-mod3", moduleName: "Derivadas", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 0 },
  { id: "calc1-t15", name: "Otimização", moduleId: "calc1-mod3", moduleName: "Derivadas", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 0 },
  { id: "calc1-t16", name: "Derivação implícita", moduleId: "calc1-mod3", moduleName: "Derivadas", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 0 },
];

const mdTopics: ExamTopic[] = [
  { id: "md-t01", name: "Conjuntos — definição", moduleId: "md-mod1", moduleName: "Conjuntos e Lógica", mastery: "proficient", score: 0.75, exercisesAttempted: 15, exercisesAvailable: 18 },
  { id: "md-t02", name: "Operações com conjuntos", moduleId: "md-mod1", moduleName: "Conjuntos e Lógica", mastery: "developing", score: 0.58, exercisesAttempted: 10, exercisesAvailable: 14 },
  { id: "md-t03", name: "Lógica proposicional", moduleId: "md-mod1", moduleName: "Conjuntos e Lógica", mastery: "developing", score: 0.52, exercisesAttempted: 8, exercisesAvailable: 12 },
  { id: "md-t04", name: "Quantificadores", moduleId: "md-mod1", moduleName: "Conjuntos e Lógica", mastery: "exposed", score: 0.30, exercisesAttempted: 3, exercisesAvailable: 8 },
  // Módulo 2
  { id: "md-t05", name: "Relações entre conjuntos", moduleId: "md-mod2", moduleName: "Relações e Funções", mastery: "exposed", score: 0.22, exercisesAttempted: 2, exercisesAvailable: 8 },
  { id: "md-t06", name: "Tipos de relações", moduleId: "md-mod2", moduleName: "Relações e Funções", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 6 },
  { id: "md-t07", name: "Funções como relações", moduleId: "md-mod2", moduleName: "Relações e Funções", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 6 },
  // Módulo 3
  { id: "md-t08", name: "Relação de equivalência", moduleId: "md-mod3", moduleName: "Ordem, Indução e Boole", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 0 },
  { id: "md-t09", name: "Relação de ordem", moduleId: "md-mod3", moduleName: "Ordem, Indução e Boole", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 0 },
  { id: "md-t10", name: "Álgebra booleana", moduleId: "md-mod3", moduleName: "Ordem, Indução e Boole", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 0 },
  { id: "md-t11", name: "Recursão e somatórios", moduleId: "md-mod3", moduleName: "Ordem, Indução e Boole", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 0 },
  { id: "md-t12", name: "Indução matemática", moduleId: "md-mod3", moduleName: "Ordem, Indução e Boole", mastery: "none", score: 0.0, exercisesAttempted: 0, exercisesAvailable: 0 },
];

// ── Assessments reais ──

export const assessments: Assessment[] = [
  // ── Cálculo I ──
  {
    id: "calc1-t1", disciplineId: "calculo-1", disciplineName: "Cálculo I",
    type: "trabalho", name: "Trabalho 1", date: "2026-04-09", weight: 1.0,
    topics: calcTopics.slice(0, 7), moduleIds: ["calc1-mod1"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "calc1-p1", disciplineId: "calculo-1", disciplineName: "Cálculo I",
    type: "prova", name: "Prova 1", date: "2026-04-16", weight: 1.0,
    topics: calcTopics.slice(0, 7), moduleIds: ["calc1-mod1"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "calc1-t2", disciplineId: "calculo-1", disciplineName: "Cálculo I",
    type: "trabalho", name: "Trabalho 2", date: "2026-05-21", weight: 1.0,
    topics: calcTopics.slice(7, 12), moduleIds: ["calc1-mod2", "calc1-mod3"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "calc1-p2", disciplineId: "calculo-1", disciplineName: "Cálculo I",
    type: "prova", name: "Prova 2", date: "2026-05-28", weight: 1.0,
    topics: calcTopics.slice(7, 12), moduleIds: ["calc1-mod2", "calc1-mod3"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "calc1-t3", disciplineId: "calculo-1", disciplineName: "Cálculo I",
    type: "trabalho", name: "Trabalho 3", date: "2026-06-23", weight: 1.0,
    topics: calcTopics.slice(12, 16), moduleIds: ["calc1-mod3"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "calc1-p3", disciplineId: "calculo-1", disciplineName: "Cálculo I",
    type: "prova", name: "Prova 3", date: "2026-06-30", weight: 1.0,
    topics: calcTopics.slice(12, 16), moduleIds: ["calc1-mod3"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "calc1-ps", disciplineId: "calculo-1", disciplineName: "Cálculo I",
    type: "ps", name: "Prova Substitutiva", date: "2026-07-07", weight: 1.0,
    topics: calcTopics, moduleIds: ["calc1-mod1", "calc1-mod2", "calc1-mod3"],
    isCumulative: true, status: "upcoming", score: null,
  },
  {
    id: "calc1-g2", disciplineId: "calculo-1", disciplineName: "Cálculo I",
    type: "g2", name: "Exame G2", date: "2026-07-14", weight: 1.0,
    topics: calcTopics, moduleIds: ["calc1-mod1", "calc1-mod2", "calc1-mod3"],
    isCumulative: true, status: "upcoming", score: null,
  },
  // ── Mat. Discreta ──
  {
    id: "md-t1", disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    type: "trabalho", name: "Trabalho 1", date: "2026-04-01", weight: 1.0,
    topics: mdTopics.slice(0, 4), moduleIds: ["md-mod1"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "md-p1", disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    type: "prova", name: "Prova 1", date: "2026-04-08", weight: 1.0,
    topics: mdTopics.slice(0, 4), moduleIds: ["md-mod1"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "md-t2", disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    type: "trabalho", name: "Trabalho 2", date: "2026-05-13", weight: 1.0,
    topics: mdTopics.slice(4, 7), moduleIds: ["md-mod2"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "md-p2", disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    type: "prova", name: "Prova 2", date: "2026-05-20", weight: 1.0,
    topics: mdTopics.slice(4, 7), moduleIds: ["md-mod2"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "md-t3", disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    type: "trabalho", name: "Trabalho 3", date: "2026-06-03", weight: 1.0,
    topics: mdTopics.slice(7, 9), moduleIds: ["md-mod3"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "md-t4", disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    type: "trabalho", name: "Trabalho 4", date: "2026-06-22", weight: 1.0,
    topics: mdTopics.slice(9, 12), moduleIds: ["md-mod3"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "md-p3", disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    type: "prova", name: "Prova 3", date: "2026-06-29", weight: 1.0,
    topics: mdTopics.slice(7, 12), moduleIds: ["md-mod3"],
    isCumulative: false, status: "upcoming", score: null,
  },
  {
    id: "md-ps", disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    type: "ps", name: "Prova Substitutiva", date: "2026-07-06", weight: 1.0,
    topics: mdTopics, moduleIds: ["md-mod1", "md-mod2", "md-mod3"],
    isCumulative: true, status: "upcoming", score: null,
  },
  {
    id: "md-g2", disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    type: "g2", name: "Exame G2", date: "2026-07-13", weight: 1.0,
    topics: mdTopics, moduleIds: ["md-mod1", "md-mod2", "md-mod3"],
    isCumulative: true, status: "upcoming", score: null,
  },
];

// ── Mock simulation results (para pós-prova demo) ──

export const mockSimulationResults: SimulationResult[] = [
  {
    examId: "md-p1",
    date: "2026-03-25",
    totalQuestions: 8,
    correct: 5,
    score: 6.25,
    timeUsedMin: 72,
    timeLimitMin: 90,
    byTopic: [
      { topicId: "md-t01", topicName: "Conjuntos — definição", correct: 2, total: 2, score: 10 },
      { topicId: "md-t02", topicName: "Operações com conjuntos", correct: 1, total: 2, score: 5 },
      { topicId: "md-t03", topicName: "Lógica proposicional", correct: 1, total: 2, score: 5 },
      { topicId: "md-t04", topicName: "Quantificadores", correct: 1, total: 2, score: 5 },
    ],
    errors: [
      { questionId: "q3", topicId: "md-t02", errorClass: "procedural", explanation: "Erro na aplicação de De Morgan em complemento" },
      { questionId: "q5", topicId: "md-t03", errorClass: "conceptual", explanation: "Confundiu bicondicional com condicional" },
      { questionId: "q7", topicId: "md-t04", errorClass: "reading", explanation: "Não identificou escopo do quantificador universal" },
    ],
  },
];
