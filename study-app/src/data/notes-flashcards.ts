// ============================================================
// NOTES & FLASHCARDS — Sistema completo de anotações
// Tipos + seed data para notas, flashcards, perguntas orais
// ============================================================

import type { MasteryLevel } from "./mock";

// ── Tipos ──

export type NoteFormat = "cornell" | "outline" | "concept-map" | "summary" | "free";
export type FlashcardType = "definition" | "theorem" | "procedure" | "example";
export type OralDifficulty = "easy" | "medium" | "hard";
export type ContentStatus = "draft" | "review" | "done";

export interface StudyNote {
  id: string;
  title: string;
  /** Markdown content — supports internal links [[topicId]] */
  content: string;
  format: NoteFormat;
  disciplineId: "calculo-1" | "mat-discreta";
  disciplineName: string;
  topicId: string;
  topicName: string;
  /** Related topic IDs for cross-linking */
  linkedTopics: string[];
  tags: string[];
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  /** Key concepts extracted */
  keyConcepts: string[];
  /** AI-generated? */
  aiGenerated: boolean;
}

export interface StudyFlashcard {
  id: string;
  front: string;
  back: string;
  type: FlashcardType;
  difficulty: 1 | 2 | 3;
  disciplineId: "calculo-1" | "mat-discreta";
  disciplineName: string;
  topicId: string;
  topicName: string;
  /** Spaced-repetition box 0-4 */
  srBox: number;
  /** Next review date */
  nextReview: string;
  /** Times reviewed */
  timesReviewed: number;
  /** Times answered correctly */
  timesCorrect: number;
  tags: string[];
  aiGenerated: boolean;
}

export interface OralQuestion {
  id: string;
  question: string;
  /** Expected key points the answer should cover */
  expectedPoints: string[];
  /** Model answer for self-check */
  modelAnswer: string;
  difficulty: OralDifficulty;
  disciplineId: "calculo-1" | "mat-discreta";
  disciplineName: string;
  topicId: string;
  topicName: string;
  /** Related concepts the student should mention */
  relatedConcepts: string[];
  tags: string[];
  aiGenerated: boolean;
}

// ── Label maps ──

export const formatLabels: Record<NoteFormat, string> = {
  cornell: "Cornell",
  outline: "Outline",
  "concept-map": "Mapa conceitual",
  summary: "Resumo",
  free: "Livre",
};

export const formatIcons: Record<NoteFormat, string> = {
  cornell: "📋",
  outline: "📝",
  "concept-map": "🗺️",
  summary: "📄",
  free: "✏️",
};

export const cardTypeLabels: Record<FlashcardType, string> = {
  definition: "Definição",
  theorem: "Teorema",
  procedure: "Procedimento",
  example: "Exemplo",
};

export const difficultyLabels: Record<OralDifficulty, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

export const statusLabels: Record<ContentStatus, string> = {
  draft: "Rascunho",
  review: "Revisão",
  done: "Pronto",
};

// ============================================================
// SEED DATA
// ============================================================

export const seedNotes: StudyNote[] = [
  {
    id: "note-01",
    title: "Conceito de função — definição formal e intuição",
    content: `# Conceito de Função

## Definição Formal
Uma **função** f: A → B é uma relação que associa a cada elemento x ∈ A **exatamente um** elemento y ∈ B.

## Pontos-chave
- **Domínio** (Dom): conjunto A — todas as entradas válidas
- **Contradomínio**: conjunto B — possíveis saídas
- **Imagem** (Im): subconjunto de B efetivamente atingido

## Teste da reta vertical
Se qualquer reta vertical cruza o gráfico mais de uma vez, **não é função**.

## Conexões
- Pré-requisito para [[c-composition]] (composição)
- Conceito compartilhado com [[c-func-discrete]] em Discreta
- Base para [[c-limit-def]] (definição de limite)

## Erros comuns
- Confundir contradomínio com imagem
- Esquecer que cada x deve ter **exatamente um** y`,
    format: "cornell",
    disciplineId: "calculo-1",
    disciplineName: "Cálculo I",
    topicId: "c-func-def",
    topicName: "Conceito de função",
    linkedTopics: ["c-composition", "c-func-discrete", "c-limit-def", "c-domain"],
    tags: ["definição", "fundamental"],
    status: "done",
    createdAt: "2026-03-10",
    updatedAt: "2026-03-20",
    keyConcepts: ["função", "domínio", "contradomínio", "imagem", "reta vertical"],
    aiGenerated: false,
  },
  {
    id: "note-02",
    title: "Domínio em composição de funções — erros recorrentes",
    content: `# Domínio em Composição f∘g

## Regra fundamental
Dom(f∘g) = {x ∈ Dom(g) : g(x) ∈ Dom(f)}

**NÃO é simplesmente Dom(g)!**

## Exemplo
- f(x) = √x → Dom(f) = [0, +∞)
- g(x) = x² - 4 → Dom(g) = ℝ
- f∘g(x) = √(x²-4) → Dom(f∘g) = (-∞, -2] ∪ [2, +∞)

## Procedimento
1. Encontrar Dom(g)
2. Resolver g(x) ∈ Dom(f)
3. Interseção dos dois conjuntos

## Erro que cometi 3x
Esquecer o passo 2 e considerar Dom(f∘g) = Dom(g) = ℝ.

## Conexões
- Depende de [[c-domain]] (domínio e imagem)
- Base para [[f-chain-rule]] (regra da cadeia)`,
    format: "outline",
    disciplineId: "calculo-1",
    disciplineName: "Cálculo I",
    topicId: "c-composition",
    topicName: "Composição f∘g",
    linkedTopics: ["c-domain", "c-func-def", "f-chain-rule"],
    tags: ["erro", "domínio", "composição"],
    status: "done",
    createdAt: "2026-03-15",
    updatedAt: "2026-03-23",
    keyConcepts: ["composição", "domínio", "imagem", "restrição"],
    aiGenerated: false,
  },
  {
    id: "note-03",
    title: "Limites — técnicas de cálculo",
    content: `# Técnicas de Cálculo de Limites

## 1. Substituição direta
Se f é contínua em a, então lim(x→a) f(x) = f(a).

## 2. Fatoração
Quando substituição dá 0/0:
- Fatorar numerador e denominador
- Cancelar fator comum (x-a)
- Substituir novamente

## 3. Racionalização
Quando aparece √ no numerador ou denominador:
- Multiplicar por conjugado
- Usar (a-b)(a+b) = a²-b²

## 4. Limite fundamental
lim(x→0) sen(x)/x = 1 → ver [[f-limit-sinx]]

## 5. Sanduíche
Quando não dá para calcular direto → ver [[t-squeeze]]

## Conexões
- Depende de [[c-limit-def]]
- Pré-requisito para [[c-continuity]] e [[c-deriv-def]]`,
    format: "summary",
    disciplineId: "calculo-1",
    disciplineName: "Cálculo I",
    topicId: "c-limit-calc",
    topicName: "Cálculo de limites",
    linkedTopics: ["c-limit-def", "f-limit-sinx", "t-squeeze", "c-continuity", "c-deriv-def"],
    tags: ["técnica", "limite", "procedimento"],
    status: "review",
    createdAt: "2026-03-18",
    updatedAt: "2026-03-25",
    keyConcepts: ["substituição", "fatoração", "racionalização", "sanduíche", "limite fundamental"],
    aiGenerated: false,
  },
  {
    id: "note-04",
    title: "Lógica proposicional — conectivos e tabelas",
    content: `# Lógica Proposicional

## Conectivos
| Símbolo | Nome | Leitura |
|---------|------|---------|
| ¬ | Negação | "não p" |
| ∧ | Conjunção | "p e q" |
| ∨ | Disjunção | "p ou q" |
| → | Condicional | "se p então q" |
| ↔ | Bicondicional | "p se e somente se q" |

## Regra de ouro da condicional
p → q é **falsa** APENAS quando p=V e q=F.
"Se chove então uso guarda-chuva" — falsa só quando chove e NÃO uso.

## Bicondicional vs Condicional
- p↔q ≡ (p→q) ∧ (q→p)
- V quando ambos têm mesmo valor

## Conexões
- Base para [[c-truth-tables]] (tabelas-verdade)
- Relação com [[t-demorgan-logic]] (De Morgan)
- Estende para [[c-quantifiers]] (quantificadores)`,
    format: "cornell",
    disciplineId: "mat-discreta",
    disciplineName: "Mat. Discreta",
    topicId: "c-prop-logic",
    topicName: "Lógica proposicional",
    linkedTopics: ["c-truth-tables", "t-demorgan-logic", "c-quantifiers"],
    tags: ["conceito", "lógica", "conectivos"],
    status: "done",
    createdAt: "2026-03-12",
    updatedAt: "2026-03-22",
    keyConcepts: ["negação", "conjunção", "disjunção", "condicional", "bicondicional"],
    aiGenerated: false,
  },
  {
    id: "note-05",
    title: "Quantificadores — ordem importa!",
    content: `# Quantificadores ∀ e ∃

## Universal (∀)
∀x P(x): "para todo x, P(x) vale"
- Negação: ¬∀x P(x) ≡ ∃x ¬P(x)
- Para provar: mostrar para x genérico
- Para refutar: um contraexemplo basta

## Existencial (∃)
∃x P(x): "existe pelo menos um x tal que P(x)"
- Negação: ¬∃x P(x) ≡ ∀x ¬P(x)
- Para provar: exibir um exemplo
- Para refutar: mostrar que não vale para nenhum

## ⚠️ ORDEM IMPORTA
- ∀x ∃y (x+y=0) → VERDADE (y=-x)
- ∃y ∀x (x+y=0) → FALSO (nenhum y serve para todo x)

## Conexões
- Depende de [[c-prop-logic]]
- Depende de [[c-sets-def]] (universo)
- Base para [[c-induction]] (indução: ∀n≥n₀)`,
    format: "outline",
    disciplineId: "mat-discreta",
    disciplineName: "Mat. Discreta",
    topicId: "c-quantifiers",
    topicName: "Quantificadores",
    linkedTopics: ["c-prop-logic", "c-sets-def", "c-induction"],
    tags: ["conceito", "quantificador", "erro"],
    status: "done",
    createdAt: "2026-03-14",
    updatedAt: "2026-03-24",
    keyConcepts: ["universal", "existencial", "negação", "ordem de quantificadores"],
    aiGenerated: false,
  },
  {
    id: "note-06",
    title: "Resumo — De Morgan (lógica e conjuntos)",
    content: `# Leis de De Morgan

## Em Lógica
- ¬(p ∧ q) ≡ ¬p ∨ ¬q
- ¬(p ∨ q) ≡ ¬p ∧ ¬q

## Em Conjuntos
- (A ∪ B)ᶜ = Aᶜ ∩ Bᶜ
- (A ∩ B)ᶜ = Aᶜ ∪ Bᶜ

## Padrão
"A negação troca ∧ por ∨ (e vice-versa)"

## Analogia
É a mesma lei operando em dois domínios diferentes!
Ver [[t-demorgan-logic]] e [[t-demorgan-sets]]

## Quando usar
- Simplificação de expressões lógicas
- Provas por contradição
- Manipulação de conjuntos`,
    format: "summary",
    disciplineId: "mat-discreta",
    disciplineName: "Mat. Discreta",
    topicId: "t-demorgan-logic",
    topicName: "De Morgan (lógica)",
    linkedTopics: ["t-demorgan-sets", "c-prop-logic", "c-set-ops"],
    tags: ["teorema", "analogia", "cross-topic"],
    status: "done",
    createdAt: "2026-03-16",
    updatedAt: "2026-03-24",
    keyConcepts: ["De Morgan", "negação", "dualidade"],
    aiGenerated: true,
  },
];

export const seedFlashcards: StudyFlashcard[] = [
  // Cálculo I
  {
    id: "fc-01", front: "O que é uma função f: A → B?",
    back: "Uma relação que associa a cada elemento x ∈ A **exatamente um** elemento y ∈ B. Notação: y = f(x).",
    type: "definition", difficulty: 1, disciplineId: "calculo-1", disciplineName: "Cálculo I",
    topicId: "c-func-def", topicName: "Conceito de função",
    srBox: 3, nextReview: "2026-03-30", timesReviewed: 5, timesCorrect: 4,
    tags: ["definição"], aiGenerated: false,
  },
  {
    id: "fc-02", front: "Qual é a diferença entre contradomínio e imagem?",
    back: "**Contradomínio** é o conjunto B declarado (possíveis saídas). **Imagem** (Im) é o subconjunto de B que f atinge de fato. Im(f) ⊆ B.",
    type: "definition", difficulty: 1, disciplineId: "calculo-1", disciplineName: "Cálculo I",
    topicId: "c-domain", topicName: "Domínio e imagem",
    srBox: 2, nextReview: "2026-03-28", timesReviewed: 4, timesCorrect: 2,
    tags: ["definição", "erro-comum"], aiGenerated: false,
  },
  {
    id: "fc-03", front: "Como encontrar Dom(f∘g)?",
    back: "Dom(f∘g) = {x ∈ Dom(g) : g(x) ∈ Dom(f)}. **Não é apenas Dom(g)!** Precisa que a imagem de g caia no domínio de f.",
    type: "procedure", difficulty: 2, disciplineId: "calculo-1", disciplineName: "Cálculo I",
    topicId: "c-composition", topicName: "Composição f∘g",
    srBox: 1, nextReview: "2026-03-27", timesReviewed: 3, timesCorrect: 1,
    tags: ["procedimento", "domínio"], aiGenerated: false,
  },
  {
    id: "fc-04", front: "Fórmula de Bhaskara?",
    back: "x = (-b ± √(b²-4ac)) / 2a, onde Δ = b²-4ac. Se Δ<0: sem raízes reais. Se Δ=0: raiz dupla.",
    type: "theorem", difficulty: 1, disciplineId: "calculo-1", disciplineName: "Cálculo I",
    topicId: "f-quad-formula", topicName: "Bhaskara",
    srBox: 4, nextReview: "2026-04-05", timesReviewed: 8, timesCorrect: 8,
    tags: ["fórmula"], aiGenerated: false,
  },
  {
    id: "fc-05", front: "lim(x→0) sen(x)/x = ?",
    back: "= 1. É o limite fundamental trigonométrico. Usado como base para derivar outros limites com seno e cosseno.",
    type: "theorem", difficulty: 2, disciplineId: "calculo-1", disciplineName: "Cálculo I",
    topicId: "f-limit-sinx", topicName: "lim sen(x)/x",
    srBox: 1, nextReview: "2026-03-27", timesReviewed: 2, timesCorrect: 1,
    tags: ["limite", "fundamental"], aiGenerated: false,
  },
  {
    id: "fc-06", front: "Quando usar o Teorema do Sanduíche?",
    back: "Quando não se consegue calcular lim f(x) diretamente, mas se pode encontrar g(x) ≤ f(x) ≤ h(x) com lim g = lim h = L. Então lim f = L. Útil com sen/cos (limitados entre -1 e 1).",
    type: "theorem", difficulty: 2, disciplineId: "calculo-1", disciplineName: "Cálculo I",
    topicId: "t-squeeze", topicName: "Teorema do Sanduíche",
    srBox: 0, nextReview: "2026-03-26", timesReviewed: 1, timesCorrect: 0,
    tags: ["teorema", "técnica"], aiGenerated: true,
  },
  // Mat. Discreta
  {
    id: "fc-07", front: "Quando p → q é FALSA?",
    back: "**Apenas** quando p = V e q = F. Em todos os outros casos (V→V, F→V, F→F) a condicional é verdadeira.",
    type: "definition", difficulty: 1, disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    topicId: "c-prop-logic", topicName: "Lógica proposicional",
    srBox: 3, nextReview: "2026-03-30", timesReviewed: 6, timesCorrect: 5,
    tags: ["lógica", "condicional"], aiGenerated: false,
  },
  {
    id: "fc-08", front: "¬(p ∧ q) ≡ ?",
    back: "≡ ¬p ∨ ¬q (Lei de De Morgan). A negação da conjunção vira disjunção das negações.",
    type: "theorem", difficulty: 1, disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    topicId: "t-demorgan-logic", topicName: "De Morgan (lógica)",
    srBox: 2, nextReview: "2026-03-28", timesReviewed: 4, timesCorrect: 3,
    tags: ["teorema", "De Morgan"], aiGenerated: false,
  },
  {
    id: "fc-09", front: "Como negar ∀x P(x)?",
    back: "¬∀x P(x) ≡ ∃x ¬P(x). \"Nem todo x satisfaz P\" equivale a \"existe x que não satisfaz P\".",
    type: "procedure", difficulty: 2, disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    topicId: "c-quantifiers", topicName: "Quantificadores",
    srBox: 1, nextReview: "2026-03-27", timesReviewed: 3, timesCorrect: 1,
    tags: ["quantificador", "negação"], aiGenerated: false,
  },
  {
    id: "fc-10", front: "∀x∃y P(x,y) é o mesmo que ∃y∀x P(x,y)?",
    back: "**NÃO!** Ordem importa. ∀x∃y: para cada x escolhe y (pode variar). ∃y∀x: um único y serve para todos. O segundo é mais forte.",
    type: "example", difficulty: 3, disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    topicId: "c-quantifiers", topicName: "Quantificadores",
    srBox: 0, nextReview: "2026-03-26", timesReviewed: 2, timesCorrect: 0,
    tags: ["quantificador", "erro-comum"], aiGenerated: false,
  },
  {
    id: "fc-11", front: "O que é uma relação de equivalência?",
    back: "Relação R em A que é: **Reflexiva** (aRa), **Simétrica** (aRb → bRa), **Transitiva** (aRb ∧ bRc → aRc). Particiona A em classes de equivalência.",
    type: "definition", difficulty: 2, disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    topicId: "c-equivalence", topicName: "Relação de equivalência",
    srBox: 0, nextReview: "2026-03-26", timesReviewed: 0, timesCorrect: 0,
    tags: ["relação", "definição"], aiGenerated: true,
  },
  {
    id: "fc-12", front: "Qual o procedimento para racionalização de limites?",
    back: "1. Identificar √ no numerador ou denominador\n2. Multiplicar por conjugado (topo e base)\n3. Usar (a-b)(a+b) = a²-b²\n4. Simplificar e substituir",
    type: "procedure", difficulty: 2, disciplineId: "calculo-1", disciplineName: "Cálculo I",
    topicId: "c-limit-calc", topicName: "Cálculo de limites",
    srBox: 1, nextReview: "2026-03-27", timesReviewed: 2, timesCorrect: 1,
    tags: ["técnica", "limite"], aiGenerated: true,
  },
];

export const seedOralQuestions: OralQuestion[] = [
  {
    id: "oq-01",
    question: "Explique o que é uma função e por que o teste da reta vertical funciona.",
    expectedPoints: [
      "Cada x do domínio associa exatamente um y",
      "Se uma reta vertical cruza o gráfico duas vezes, existem dois y para o mesmo x",
      "Isso viola a unicidade da definição de função",
    ],
    modelAnswer: "Uma função f: A → B é uma relação que associa a cada elemento do domínio A exatamente um elemento do contradomínio B. O teste da reta vertical funciona porque, se uma reta x=c cruza o gráfico em dois pontos, então f(c) teria dois valores, violando a definição de função.",
    difficulty: "easy",
    disciplineId: "calculo-1", disciplineName: "Cálculo I",
    topicId: "c-func-def", topicName: "Conceito de função",
    relatedConcepts: ["domínio", "contradomínio", "imagem"],
    tags: ["definição"], aiGenerated: false,
  },
  {
    id: "oq-02",
    question: "Qual é o procedimento correto para encontrar o domínio de f∘g? Dê um exemplo.",
    expectedPoints: [
      "Primeiro encontrar Dom(g)",
      "Depois resolver g(x) ∈ Dom(f)",
      "O domínio é a interseção dessas condições",
      "Exemplo concreto com restrição",
    ],
    modelAnswer: "Para encontrar Dom(f∘g), primeiro identifico Dom(g), depois resolvo a condição g(x) ∈ Dom(f). O domínio é a interseção. Exemplo: f(x) = √x (Dom: x≥0) e g(x) = x²-4 (Dom: ℝ). Preciso x²-4 ≥ 0, ou seja, x ≤ -2 ou x ≥ 2. Então Dom(f∘g) = (-∞,-2] ∪ [2,+∞).",
    difficulty: "medium",
    disciplineId: "calculo-1", disciplineName: "Cálculo I",
    topicId: "c-composition", topicName: "Composição f∘g",
    relatedConcepts: ["domínio", "imagem", "composição"],
    tags: ["procedimento", "domínio"], aiGenerated: false,
  },
  {
    id: "oq-03",
    question: "Enuncie e explique intuitivamente o Teorema do Sanduíche.",
    expectedPoints: [
      "Se g(x) ≤ f(x) ≤ h(x) perto de a",
      "E lim g(x) = lim h(x) = L quando x→a",
      "Então lim f(x) = L",
      "Intuição: f está 'espremida' entre dois limites iguais",
    ],
    modelAnswer: "O Teorema do Sanduíche diz: se g(x) ≤ f(x) ≤ h(x) numa vizinhança de a (exceto talvez em a), e lim(x→a) g(x) = lim(x→a) h(x) = L, então lim(x→a) f(x) = L. Intuitivamente, f está espremida entre duas funções que convergem para o mesmo valor, então f é forçada a convergir para L também.",
    difficulty: "medium",
    disciplineId: "calculo-1", disciplineName: "Cálculo I",
    topicId: "t-squeeze", topicName: "Teorema do Sanduíche",
    relatedConcepts: ["limite", "desigualdade", "convergência"],
    tags: ["teorema"], aiGenerated: false,
  },
  {
    id: "oq-04",
    question: "Explique a Lei de De Morgan e mostre que ela vale tanto em lógica quanto em conjuntos.",
    expectedPoints: [
      "¬(p∧q) ≡ ¬p∨¬q e ¬(p∨q) ≡ ¬p∧¬q",
      "(A∪B)ᶜ = Aᶜ∩Bᶜ e (A∩B)ᶜ = Aᶜ∪Bᶜ",
      "A negação inverte o operador (∧↔∨ e ∪↔∩)",
      "É a mesma estrutura em dois domínios",
    ],
    modelAnswer: "A Lei de De Morgan tem duas formas. Em lógica: ¬(p∧q) ≡ ¬p∨¬q e ¬(p∨q) ≡ ¬p∧¬q. Em conjuntos: (A∪B)ᶜ = Aᶜ∩Bᶜ e (A∩B)ᶜ = Aᶜ∪Bᶜ. O padrão é que a negação/complemento inverte o operador — conjunção vira disjunção e vice-versa. Isso mostra que lógica e teoria de conjuntos têm estrutura algébrica análoga.",
    difficulty: "medium",
    disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    topicId: "t-demorgan-logic", topicName: "De Morgan (lógica)",
    relatedConcepts: ["De Morgan conjuntos", "negação", "dualidade"],
    tags: ["teorema", "cross-topic"], aiGenerated: false,
  },
  {
    id: "oq-05",
    question: "Por que a ordem dos quantificadores importa? Dê um exemplo concreto.",
    expectedPoints: [
      "∀x∃y: para cada x existe um y (pode depender de x)",
      "∃y∀x: existe um único y que funciona para todo x",
      "O segundo é estritamente mais forte",
      "Exemplo: ∀x∃y(x+y=0) é verdade, mas ∃y∀x(x+y=0) é falso",
    ],
    modelAnswer: "A ordem importa porque muda quem depende de quem. ∀x∃y(x+y=0) é verdade: para cada x, posso escolher y=-x. Mas ∃y∀x(x+y=0) é falso: não existe um único y que funcione para todo x. O segundo quantificador fica 'preso' na escolha do primeiro.",
    difficulty: "hard",
    disciplineId: "mat-discreta", disciplineName: "Mat. Discreta",
    topicId: "c-quantifiers", topicName: "Quantificadores",
    relatedConcepts: ["universal", "existencial", "escopo"],
    tags: ["quantificador", "erro-comum"], aiGenerated: false,
  },
  {
    id: "oq-06",
    question: "Compare continuidade com existência de limite. Uma implica a outra?",
    expectedPoints: [
      "Continuidade em a: lim(x→a) f(x) = f(a)",
      "Requer 3 condições: f(a) existe, lim existe, e são iguais",
      "Limite pode existir sem continuidade (f(a) ≠ L ou f(a) não definido)",
      "Continuidade implica existência de limite, mas não vice-versa",
    ],
    modelAnswer: "Continuidade em a requer três coisas: f(a) existe, lim(x→a)f(x) existe, e ambos são iguais. Portanto, continuidade implica existência de limite. Mas o contrário não vale: o limite pode existir sem que f(a) esteja definido ou sem que sejam iguais. Exemplo: f(x) = (x²-1)/(x-1) tem limite 2 em x=1, mas f(1) não é definida.",
    difficulty: "hard",
    disciplineId: "calculo-1", disciplineName: "Cálculo I",
    topicId: "c-continuity", topicName: "Continuidade",
    relatedConcepts: ["limite", "continuidade", "descontinuidade removível"],
    tags: ["conceito", "comparação"], aiGenerated: true,
  },
];
