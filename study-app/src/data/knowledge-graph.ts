// ============================================================
// KNOWLEDGE GRAPH — Grafo de conhecimento completo
// Nós: conceitos, fórmulas, teoremas
// Arestas: depends_on, connects, appears_in_exam
// ============================================================

import type { MasteryLevel } from "./mock";

// ── Tipos ──

export type NodeKind = "concept" | "formula" | "theorem";

export type EdgeKind = "depends_on" | "connects" | "appears_in_exam";

export interface KGNode {
  id: string;
  label: string;
  kind: NodeKind;
  disciplineId: "calculo-1" | "mat-discreta";
  moduleId: string;
  moduleName: string;
  /** Mastery do aluno */
  mastery: MasteryLevel;
  score: number;
  /** Descrição curta */
  description: string;
  /** Notação LaTeX se aplicável */
  latex?: string;
  /** Posição no layout (hierárquico por módulo) */
  x: number;
  y: number;
  /** Número de erros registrados neste nó */
  errorCount: number;
  /** IDs de provas onde aparece */
  examIds: string[];
}

export interface KGEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  /** Label descritivo */
  label?: string;
  /** Peso/importância 1-3 */
  weight: 1 | 2 | 3;
}

// ── Constantes visuais ──

export const NODE_RADIUS: Record<NodeKind, number> = {
  concept: 18,
  formula: 14,
  theorem: 16,
};

export const NODE_SHAPE: Record<NodeKind, "circle" | "diamond" | "hexagon"> = {
  concept: "circle",
  formula: "diamond",
  theorem: "hexagon",
};

export const MASTERY_FILL: Record<MasteryLevel, string> = {
  none: "#3f3f46",
  exposed: "#eab308",
  developing: "#f97316",
  proficient: "#3b82f6",
  mastered: "#10b981",
};

export const EDGE_STYLE: Record<EdgeKind, { color: string; dash: string; width: number }> = {
  depends_on: { color: "#52525b", dash: "none", width: 1.5 },
  connects: { color: "#6366f1", dash: "6 3", width: 1 },
  appears_in_exam: { color: "#ef4444", dash: "3 3", width: 1 },
};

// ── Layout helpers ──
// Colunas: Calc-Mod1 (x:60-320), Calc-Mod2 (x:360-520), Calc-Mod3 (x:560-720)
//          MD-Mod1 (x:800-960), MD-Mod2 (x:1000-1160), MD-Mod3 (x:1200-1400)

// ============================================================
// SEED — Nós
// ============================================================

export const nodes: KGNode[] = [
  // ═══════════════════════════════════════════
  // CÁLCULO I — Módulo 1: Funções e Modelos
  // ═══════════════════════════════════════════

  // Conceitos
  { id: "c-func-def", label: "Conceito de função", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    mastery: "proficient", score: 0.78, description: "Relação que associa cada elemento do domínio a exatamente um do contradomínio.", x: 80, y: 70, errorCount: 0, examIds: ["calc1-p1"] },
  { id: "c-domain", label: "Domínio e imagem", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    mastery: "proficient", score: 0.72, description: "Dom(f) = conjunto de entradas válidas. Im(f) = conjunto de saídas atingidas.", x: 190, y: 70, errorCount: 2, examIds: ["calc1-p1"] },
  { id: "c-affine-quad", label: "Afim e quadrática", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    mastery: "developing", score: 0.58, description: "f(x)=ax+b (reta) e f(x)=ax²+bx+c (parábola).", x: 80, y: 170, errorCount: 1, examIds: ["calc1-p1"] },
  { id: "c-composition", label: "Composição f∘g", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    mastery: "developing", score: 0.45, description: "(f∘g)(x) = f(g(x)). Dom(f∘g) exige Im(g) ⊆ Dom(f).", x: 190, y: 170, errorCount: 3, examIds: ["calc1-p1"] },
  { id: "c-trig", label: "Trigonométricas", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    mastery: "exposed", score: 0.25, description: "sen, cos, tan e suas propriedades periódicas.", x: 80, y: 270, errorCount: 0, examIds: ["calc1-p1"] },
  { id: "c-exp-log", label: "Exponencial e log", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    mastery: "none", score: 0.0, description: "eˣ e ln(x): inversas mútuas. Domínio de ln: x > 0.", x: 190, y: 270, errorCount: 0, examIds: ["calc1-p1"] },
  { id: "c-inverse", label: "Função inversa", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    mastery: "exposed", score: 0.30, description: "f⁻¹ existe ⇔ f é bijetora. Gráfico refletido em y=x.", x: 300, y: 170, errorCount: 0, examIds: ["calc1-p1"] },

  // Fórmulas — Módulo 1
  { id: "f-quad-formula", label: "Bhaskara", kind: "formula", disciplineId: "calculo-1", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    mastery: "proficient", score: 0.80, description: "x = (-b ± √(b²-4ac)) / 2a", latex: "x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}", x: 140, y: 220, errorCount: 0, examIds: ["calc1-p1"] },
  { id: "f-vertex", label: "Vértice da parábola", kind: "formula", disciplineId: "calculo-1", moduleId: "calc1-mod1", moduleName: "Funções e Modelos",
    mastery: "developing", score: 0.55, description: "V = (-b/2a, -Δ/4a)", latex: "V=\\left(\\frac{-b}{2a},\\frac{-\\Delta}{4a}\\right)", x: 80, y: 220, errorCount: 0, examIds: ["calc1-p1"] },

  // ═══════════════════════════════════════════
  // CÁLCULO I — Módulo 2: Limites
  // ═══════════════════════════════════════════

  { id: "c-limit-def", label: "Definição de limite", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    mastery: "developing", score: 0.42, description: "lim(x→a) f(x) = L: f(x) se aproxima de L quando x→a.", x: 420, y: 70, errorCount: 1, examIds: ["calc1-p2"] },
  { id: "c-limit-calc", label: "Cálculo de limites", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    mastery: "exposed", score: 0.28, description: "Substituição, fatoração, racionalização, L'Hôpital.", x: 530, y: 70, errorCount: 2, examIds: ["calc1-p2"] },
  { id: "c-limit-inf", label: "Limites no infinito", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    mastery: "none", score: 0.0, description: "Comportamento de f(x) quando x → ±∞. Assíntotas horizontais.", x: 420, y: 170, errorCount: 1, examIds: ["calc1-p2"] },
  { id: "c-continuity", label: "Continuidade", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    mastery: "exposed", score: 0.31, description: "f contínua em a ⇔ lim(x→a)f(x) = f(a). TVI.", x: 530, y: 170, errorCount: 0, examIds: ["calc1-p2"] },

  // Fórmulas/Teoremas — Limites
  { id: "f-limit-sinx", label: "lim sen(x)/x", kind: "formula", disciplineId: "calculo-1", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    mastery: "exposed", score: 0.20, description: "lim(x→0) sen(x)/x = 1", latex: "\\lim_{x\\to 0}\\frac{\\sin x}{x}=1", x: 475, y: 120, errorCount: 1, examIds: ["calc1-p2"] },
  { id: "t-squeeze", label: "Teorema do Sanduíche", kind: "theorem", disciplineId: "calculo-1", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    mastery: "none", score: 0.0, description: "Se g≤f≤h e lim g = lim h = L, então lim f = L.", x: 475, y: 220, errorCount: 0, examIds: ["calc1-p2"] },
  { id: "t-tvi", label: "Teorema do Valor Intermediário", kind: "theorem", disciplineId: "calculo-1", moduleId: "calc1-mod2", moduleName: "Limites e Taxas",
    mastery: "none", score: 0.0, description: "Se f contínua em [a,b] e f(a)<k<f(b), então ∃c com f(c)=k.", x: 580, y: 220, errorCount: 0, examIds: ["calc1-p2"] },

  // ═══════════════════════════════════════════
  // CÁLCULO I — Módulo 3: Derivadas
  // ═══════════════════════════════════════════

  { id: "c-deriv-def", label: "Definição de derivada", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod3", moduleName: "Derivadas",
    mastery: "none", score: 0.0, description: "f'(a) = lim(h→0) [f(a+h)-f(a)]/h. Taxa instantânea.", x: 700, y: 70, errorCount: 0, examIds: ["calc1-p3"] },
  { id: "c-deriv-rules", label: "Regras de derivação", kind: "concept", disciplineId: "calculo-1", moduleId: "calc1-mod3", moduleName: "Derivadas",
    mastery: "none", score: 0.0, description: "Potência, produto, quociente, cadeia.", x: 700, y: 170, errorCount: 0, examIds: ["calc1-p3"] },
  { id: "f-chain-rule", label: "Regra da cadeia", kind: "formula", disciplineId: "calculo-1", moduleId: "calc1-mod3", moduleName: "Derivadas",
    mastery: "none", score: 0.0, description: "[f(g(x))]' = f'(g(x))·g'(x)", latex: "\\frac{d}{dx}f(g(x))=f'(g(x))\\cdot g'(x)", x: 750, y: 120, errorCount: 0, examIds: ["calc1-p3"] },
  { id: "t-lhopital", label: "L'Hôpital", kind: "theorem", disciplineId: "calculo-1", moduleId: "calc1-mod3", moduleName: "Derivadas",
    mastery: "none", score: 0.0, description: "Se lim f/g é 0/0 ou ∞/∞, então lim f/g = lim f'/g'.", x: 750, y: 220, errorCount: 0, examIds: ["calc1-p3"] },

  // ═══════════════════════════════════════════
  // MAT. DISCRETA — Módulo 1: Conjuntos e Lógica
  // ═══════════════════════════════════════════

  { id: "c-sets-def", label: "Conjuntos", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod1", moduleName: "Conjuntos e Lógica",
    mastery: "proficient", score: 0.75, description: "Coleção de objetos. Notação: extensão e compreensão.", x: 900, y: 70, errorCount: 0, examIds: ["md-p1"] },
  { id: "c-set-ops", label: "Operações de conjuntos", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod1", moduleName: "Conjuntos e Lógica",
    mastery: "developing", score: 0.58, description: "∪, ∩, \\, complemento, produto cartesiano.", x: 1010, y: 70, errorCount: 1, examIds: ["md-p1"] },
  { id: "c-prop-logic", label: "Lógica proposicional", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod1", moduleName: "Conjuntos e Lógica",
    mastery: "developing", score: 0.52, description: "Proposições, conectivos: ∧, ∨, →, ↔, ¬.", x: 900, y: 170, errorCount: 2, examIds: ["md-p1"] },
  { id: "c-truth-tables", label: "Tabelas-verdade", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod1", moduleName: "Conjuntos e Lógica",
    mastery: "developing", score: 0.55, description: "Enumeração de todos os valores de uma fórmula.", x: 1010, y: 170, errorCount: 1, examIds: ["md-p1"] },
  { id: "c-quantifiers", label: "Quantificadores", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod1", moduleName: "Conjuntos e Lógica",
    mastery: "exposed", score: 0.30, description: "∀ (universal), ∃ (existencial). Ordem importa.", x: 955, y: 270, errorCount: 3, examIds: ["md-p1"] },

  // Fórmulas/Teoremas — Lógica
  { id: "t-demorgan-logic", label: "De Morgan (lógica)", kind: "theorem", disciplineId: "mat-discreta", moduleId: "md-mod1", moduleName: "Conjuntos e Lógica",
    mastery: "developing", score: 0.50, description: "¬(p∧q) ≡ ¬p∨¬q e ¬(p∨q) ≡ ¬p∧¬q.", x: 900, y: 120, errorCount: 0, examIds: ["md-p1"] },
  { id: "t-demorgan-sets", label: "De Morgan (conjuntos)", kind: "theorem", disciplineId: "mat-discreta", moduleId: "md-mod1", moduleName: "Conjuntos e Lógica",
    mastery: "developing", score: 0.48, description: "(A∪B)ᶜ = Aᶜ∩Bᶜ e (A∩B)ᶜ = Aᶜ∪Bᶜ.", x: 1010, y: 120, errorCount: 1, examIds: ["md-p1"] },

  // ═══════════════════════════════════════════
  // MAT. DISCRETA — Módulo 2: Relações e Funções
  // ═══════════════════════════════════════════

  { id: "c-relations", label: "Relações", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod2", moduleName: "Relações e Funções",
    mastery: "exposed", score: 0.22, description: "Subconjunto de A×B. Reflexiva, simétrica, transitiva.", x: 1150, y: 70, errorCount: 0, examIds: ["md-p2"] },
  { id: "c-rel-types", label: "Tipos de relações", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod2", moduleName: "Relações e Funções",
    mastery: "none", score: 0.0, description: "Equivalência (RST), ordem parcial (RAT), ordem total.", x: 1150, y: 170, errorCount: 0, examIds: ["md-p2"] },
  { id: "c-func-discrete", label: "Funções (discreta)", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod2", moduleName: "Relações e Funções",
    mastery: "none", score: 0.0, description: "Relação funcional. Injetora, sobrejetora, bijetora.", x: 1260, y: 120, errorCount: 0, examIds: ["md-p2"] },

  // ═══════════════════════════════════════════
  // MAT. DISCRETA — Módulo 3: Ordem, Indução, Boole
  // ═══════════════════════════════════════════

  { id: "c-equivalence", label: "Relação de equivalência", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod3", moduleName: "Ordem, Indução e Boole",
    mastery: "none", score: 0.0, description: "Reflexiva + simétrica + transitiva. Classes de equivalência.", x: 1400, y: 70, errorCount: 0, examIds: ["md-p3"] },
  { id: "c-order", label: "Relação de ordem", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod3", moduleName: "Ordem, Indução e Boole",
    mastery: "none", score: 0.0, description: "Reflexiva + antissimétrica + transitiva. Hasse.", x: 1400, y: 170, errorCount: 0, examIds: ["md-p3"] },
  { id: "c-boolean", label: "Álgebra booleana", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod3", moduleName: "Ordem, Indução e Boole",
    mastery: "none", score: 0.0, description: "Reticulado complementado distributivo. Portas lógicas.", x: 1510, y: 70, errorCount: 0, examIds: ["md-p3"] },
  { id: "c-recursion", label: "Recursão e somatórios", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod3", moduleName: "Ordem, Indução e Boole",
    mastery: "none", score: 0.0, description: "Definições recursivas. Σ, Π, sequências.", x: 1510, y: 170, errorCount: 0, examIds: ["md-p3"] },
  { id: "c-induction", label: "Indução matemática", kind: "concept", disciplineId: "mat-discreta", moduleId: "md-mod3", moduleName: "Ordem, Indução e Boole",
    mastery: "none", score: 0.0, description: "Caso base + passo indutivo. Indução forte.", x: 1455, y: 270, errorCount: 0, examIds: ["md-p3"] },

  // Fórmulas/Teoremas — Módulo 3
  { id: "f-gauss-sum", label: "Soma de Gauss", kind: "formula", disciplineId: "mat-discreta", moduleId: "md-mod3", moduleName: "Ordem, Indução e Boole",
    mastery: "none", score: 0.0, description: "1+2+...+n = n(n+1)/2", latex: "\\sum_{k=1}^n k = \\frac{n(n+1)}{2}", x: 1455, y: 220, errorCount: 0, examIds: ["md-p3"] },

  // ═══════════════════════════════════════════
  // CROSS-DISCIPLINE
  // ═══════════════════════════════════════════

  { id: "c-func-bridge", label: "Função (ponte)", kind: "concept", disciplineId: "calculo-1", moduleId: "cross", moduleName: "Interdisciplinar",
    mastery: "developing", score: 0.50, description: "Conceito de função compartilhado entre Cálculo e Discreta.", x: 580, y: 310, errorCount: 0, examIds: [] },
];

// ============================================================
// SEED — Arestas
// ============================================================

export const edges: KGEdge[] = [
  // ── Cálculo Mod1: depends_on ──
  { id: "e01", source: "c-func-def", target: "c-domain", kind: "depends_on", weight: 3 },
  { id: "e02", source: "c-func-def", target: "c-affine-quad", kind: "depends_on", weight: 2 },
  { id: "e03", source: "c-func-def", target: "c-trig", kind: "depends_on", weight: 2 },
  { id: "e04", source: "c-func-def", target: "c-exp-log", kind: "depends_on", weight: 2 },
  { id: "e05", source: "c-func-def", target: "c-composition", kind: "depends_on", weight: 3 },
  { id: "e06", source: "c-domain", target: "c-composition", kind: "depends_on", label: "Dom(f∘g)", weight: 3 },
  { id: "e07", source: "c-func-def", target: "c-inverse", kind: "depends_on", weight: 2 },
  { id: "e08", source: "c-affine-quad", target: "f-quad-formula", kind: "depends_on", weight: 2 },
  { id: "e09", source: "c-affine-quad", target: "f-vertex", kind: "depends_on", weight: 2 },

  // ── Cálculo Mod1 → Mod2: depends_on ──
  { id: "e10", source: "c-func-def", target: "c-limit-def", kind: "depends_on", weight: 3 },
  { id: "e11", source: "c-composition", target: "c-limit-calc", kind: "depends_on", label: "limites de compostas", weight: 2 },
  { id: "e12", source: "c-limit-def", target: "c-limit-calc", kind: "depends_on", weight: 3 },
  { id: "e13", source: "c-limit-def", target: "c-limit-inf", kind: "depends_on", weight: 2 },
  { id: "e14", source: "c-limit-def", target: "c-continuity", kind: "depends_on", weight: 3 },
  { id: "e15", source: "c-trig", target: "f-limit-sinx", kind: "depends_on", weight: 2 },
  { id: "e16", source: "c-limit-calc", target: "f-limit-sinx", kind: "depends_on", weight: 2 },
  { id: "e17", source: "c-limit-def", target: "t-squeeze", kind: "depends_on", weight: 2 },
  { id: "e18", source: "c-continuity", target: "t-tvi", kind: "depends_on", weight: 3 },

  // ── Cálculo Mod2 → Mod3: depends_on ──
  { id: "e19", source: "c-limit-def", target: "c-deriv-def", kind: "depends_on", label: "def. via limite", weight: 3 },
  { id: "e20", source: "c-deriv-def", target: "c-deriv-rules", kind: "depends_on", weight: 3 },
  { id: "e21", source: "c-composition", target: "f-chain-rule", kind: "depends_on", label: "composição → cadeia", weight: 3 },
  { id: "e22", source: "c-deriv-rules", target: "f-chain-rule", kind: "depends_on", weight: 3 },
  { id: "e23", source: "c-deriv-rules", target: "t-lhopital", kind: "depends_on", weight: 2 },
  { id: "e24", source: "c-limit-calc", target: "t-lhopital", kind: "depends_on", label: "resolve 0/0 e ∞/∞", weight: 2 },

  // ── Discreta Mod1: depends_on ──
  { id: "e30", source: "c-sets-def", target: "c-set-ops", kind: "depends_on", weight: 3 },
  { id: "e31", source: "c-prop-logic", target: "c-truth-tables", kind: "depends_on", weight: 3 },
  { id: "e32", source: "c-prop-logic", target: "c-quantifiers", kind: "depends_on", weight: 3 },
  { id: "e33", source: "c-sets-def", target: "c-quantifiers", kind: "depends_on", label: "universo", weight: 2 },
  { id: "e34", source: "c-prop-logic", target: "t-demorgan-logic", kind: "depends_on", weight: 2 },
  { id: "e35", source: "c-set-ops", target: "t-demorgan-sets", kind: "depends_on", weight: 2 },

  // ── Discreta Mod1 → Mod2 ──
  { id: "e36", source: "c-set-ops", target: "c-relations", kind: "depends_on", label: "R ⊆ A×B", weight: 3 },
  { id: "e37", source: "c-relations", target: "c-rel-types", kind: "depends_on", weight: 3 },
  { id: "e38", source: "c-relations", target: "c-func-discrete", kind: "depends_on", weight: 2 },
  { id: "e39", source: "c-set-ops", target: "c-func-discrete", kind: "depends_on", weight: 2 },

  // ── Discreta Mod2 → Mod3 ──
  { id: "e40", source: "c-rel-types", target: "c-equivalence", kind: "depends_on", weight: 3 },
  { id: "e41", source: "c-rel-types", target: "c-order", kind: "depends_on", weight: 3 },
  { id: "e42", source: "c-prop-logic", target: "c-boolean", kind: "depends_on", label: "∧∨¬ → AND/OR/NOT", weight: 2 },
  { id: "e43", source: "c-sets-def", target: "c-recursion", kind: "depends_on", weight: 1 },
  { id: "e44", source: "c-quantifiers", target: "c-induction", kind: "depends_on", label: "∀n≥n₀", weight: 3 },
  { id: "e45", source: "c-recursion", target: "c-induction", kind: "depends_on", weight: 3 },
  { id: "e46", source: "c-recursion", target: "f-gauss-sum", kind: "depends_on", weight: 2 },

  // ── connects (analogias cross-topic) ──
  { id: "e50", source: "t-demorgan-logic", target: "t-demorgan-sets", kind: "connects", label: "mesma lei em domínios diferentes", weight: 2 },
  { id: "e51", source: "c-func-def", target: "c-func-bridge", kind: "connects", label: "conceito compartilhado", weight: 1 },
  { id: "e52", source: "c-func-discrete", target: "c-func-bridge", kind: "connects", label: "conceito compartilhado", weight: 1 },
  { id: "e53", source: "c-inverse", target: "c-func-discrete", kind: "connects", label: "bijeção = inversível", weight: 2 },
  { id: "e54", source: "c-prop-logic", target: "c-continuity", kind: "connects", label: "lógica em ε-δ", weight: 1 },

  // ── appears_in_exam ──
  { id: "e60", source: "c-domain", target: "c-composition", kind: "appears_in_exam", label: "P1 Cálculo", weight: 2 },
  { id: "e61", source: "c-limit-def", target: "c-limit-calc", kind: "appears_in_exam", label: "P2 Cálculo", weight: 2 },
  { id: "e62", source: "c-sets-def", target: "c-quantifiers", kind: "appears_in_exam", label: "P1 Discreta", weight: 2 },
];
