# HEXXONAI 3.0 — De Chatbot a Copiloto Omnisciente

> *"Não é sobre ter mais funcionalidades. É sobre ter uma inteligência que te conhece melhor do que você mesmo."*

---

## Diagnóstico do Estado Atual (v2.0)

Após explorar cada página do app ao vivo na Vercel, cada tabela do Supabase (17 tabelas, 26 nós no knowledge graph, 7 flashcards, 8 exercícios, 3 erros classificados, 10 sessões de estudo, $0.41 gastos com IA) e cada linha do código-fonte (586 linhas no orchestrator, 9 serviços de IA, multi-model Claude+Gemini), identifiquei o padrão central:

**O HexxonAI 2.0 é reativo.** Ele espera você perguntar, responde, e para. As 8 páginas funcionam como ilhas — cada uma tem seus dados, mas eles não conversam entre si de forma inteligente. É como ter o HEXXONAI do Homem de Ferro... mas que só responde quando perguntado e esquece o que fez ontem.

**O HexxonAI do Tony Stark é fundamentalmente diferente:** ele antecipa, conecta, age autonomamente e evolui. A versão 3.0 precisa fechar essa lacuna.

| | HexxonAI 2.0 | HexxonAI 3.0 |
|---|---|---|
| **Presença** | Página separada | Em toda página |
| **Modo** | Reativo (pergunta → resposta) | Proativo (observa → age) |
| **Escopo** | Uma ação por vez | Orquestra operações multi-entidade |
| **Inteligência** | Contexto da conversa | Sintetiza mastery + erros + grafo + provas + sessões |
| **Temporalidade** | Momento presente | Planeja dias/semanas, monitora progresso |
| **Personalização** | Adapta texto ao mastery | Adapta todo o plano de estudo ao perfil |

**A essência:** HexxonAI 2.0 é um assistente. HexxonAI 3.0 é um copiloto que voa junto com você.

---

## As 6 Ideias — Profundas e Integradas

### 1. 👁️ Omnipresença — HexxonAI em Toda Página

**O problema:** Hoje, HexxonAI vive numa página separada (`/hexxon-ai`). Tony Stark não precisa ir até um cômodo específico para falar com o HEXXONAI — ele está em todo lugar.

**O que muda:** HexxonAI vira um painel lateral deslizante acessível de qualquer página via `⌘J`. Mas o diferencial não é só estar presente — é que ele sabe exatamente o que você está olhando.

O contexto de página, nota aberta, exercício atual, tópico selecionado — tudo isso já existe no data model. A tabela `hexxon-ai_conversations` tem `current_page`, `discipline_id` e `topic_id` — os campos existem, mas o HexxonAI não os usa de verdade. Se você está na página de exercícios olhando um erro em composição de funções e abre o HexxonAI, ele não sabe disso. Você precisa explicar tudo do zero. Isso acaba.

**Cenários concretos:**

**Na página de exercícios** — Você erra um exercício. Sem você pedir, HexxonAI aparece com uma dica socrática baseada no erro específico.

**Na página de diagnóstico** — Você está olhando o erro "Encontre Dom(f∘g) onde f(x)=√x e g(x)=x-3" (conceitual, severidade alta). Clica `⌘J`:

> *HexxonAI: "Vejo que você está analisando seu erro em composição de funções. O problema foi conceitual — você aplicou f antes de g, invertendo a ordem. Isso é comum: 68% dos alunos cometem esse erro. Quer que eu:*
> 1. *Explique composição passo a passo com analogias?*
> 2. *Gere 3 exercícios progressivos focados nesse erro específico?*
> 3. *Crie um mapa conceitual mostrando como composição se conecta com domínio e imagem?"*

**Na página de notas** — Você está editando a nota sobre Funções Trigonométricas:

> *HexxonAI: "Essa nota sobre Limites não menciona a definição epsilon-delta. Quer que eu complete? Também posso gerar flashcards dos conceitos-chave que você escreveu."*

**No mapa de conhecimento** — Você clica num nó:

> *HexxonAI: "Séries depende de Sequências, que você ainda não domina. Quer começar por Sequências?"*

**Na página de provas** — Você clica na P1 de Funções (13/04):

> *HexxonAI: "P1 de Funções — faltam 18 dias. Aqui está seu status:*
> - *Conceito de função: Proficiente ✅*
> - *Domínio e imagem: Proficiente ✅*
> - *Afim e quadrática: Developing ⚠️*
> - *Definição de limite: Developing ⚠️*
> - *Cálculo de limites: Exposed 🔴*
> - *Limites no infinito: None 🔴*
>
> *Readiness score: 38%. Precisa focar em limites. Quer o plano de ataque?"*

**Implementação técnica:**

No `hexxon-ai/context.ts`, já existe a função que monta o system prompt. A mudança é enriquecer esse contexto com dados reais da página atual:

```typescript
async function buildPageContext(currentPage: string, params: Record<string, string>) {
  switch (currentPage) {
    case '/diagnostico':
      const errors = await getErrorOccurrences();
      return { errors, focusedError: params.errorId ? errors.find(e => e.id === params.errorId) : null };

    case '/provas':
      const assessment = params.assessmentId ? await getAssessment(params.assessmentId) : null;
      const topicsMastery = assessment ? await getTopicsMasteryForAssessment(assessment.id) : null;
      const readinessScore = topicsMastery ? calculateReadiness(topicsMastery) : null;
      return { assessment, topicsMastery, readinessScore };

    case '/notas':
      const currentNote = params.noteId ? await getNote(params.noteId) : null;
      const relatedTopics = currentNote ? await getRelatedTopics(currentNote.topic_id) : null;
      return { currentNote, relatedTopics };

    case '/exercicios':
      const currentExercise = params.exerciseId ? await getExercise(params.exerciseId) : null;
      const recentAttempts = currentExercise ? await getAttempts(currentExercise.id) : null;
      return { currentExercise, recentAttempts };

    case '/mapa':
      const selectedNode = params.nodeId ? await getKgNode(params.nodeId) : null;
      const neighbors = selectedNode ? await getNodeNeighbors(selectedNode.id) : null;
      return { selectedNode, neighbors };
  }
}
```

O floating button (`floating-button.tsx`) passa `window.location.pathname` + parâmetros relevantes para o HexxonAI. O orchestrator usa isso para montar um system prompt hiper-contextual. Isso transforma cada página do app num ambiente assistido.

**Por que é transformador:** Elimina a fricção de "explicar para o HexxonAI o que estou fazendo". O HEXXONAI do Tony sabe que ele está soldando uma peça — não precisa ser informado. Essa consciência contextual é o que faz a interação parecer mágica.

---

### 2. 🎯 Mission Mode — Modo Objetivo, Não Modo Pergunta

**O problema:** O HEXXONAI do Iron Man entende intenção, não só comandos. Tony diz "prepare-se para a luta" e o HEXXONAI prepara tudo — armadura, armas, análise do inimigo. O HexxonAI 2.0 tem tool execution no orchestrator, mas é limitado. Ele pode gerar texto, mas não pode criar um flashcard, registrar uma sessão de estudo, ou atualizar o mastery de um tópico diretamente pela conversa.

**O que muda:** Você diz ao HexxonAI um objetivo — e ele orquestra uma operação completa, não uma resposta.

```
Você: "Preciso tirar 8 na P1 de Cálculo."

HexxonAI não responde com texto. Ele orquestra:
1. Analisa o assessment: data, tópicos cobertos, peso
2. Cruza com seu mastery por tópico e seus padrões de erro
3. Identifica os gaps via knowledge graph (pré-requisitos não dominados bloqueando tópicos da prova)
4. Gera um plano de N dias com sessões de estudo, exercícios direcionados, flashcards, e simulados
5. Cria tudo no sistema: sessões no calendário, exercícios no banco, flashcards para revisão, nota-resumo dos tópicos fracos

HexxonAI: "Missão criada: P1 Cálculo → nota 8.0
✓ Plano de 18 dias salvo no calendário
✓ 12 exercícios gerados (focados em limites e composição — seus gaps)
✓ 15 flashcards criados dos conceitos críticos
✓ 2 simulados agendados (dia 12 e dia 17)
✓ Nota-resumo dos 4 tópicos fracos criada no vault

Amanhã começo o briefing diário. Vamos tirar esse 8, Otávio."
```

A cada dia, quando você abre o app:

> *"Dia 3/7 do plano para P1 Cálculo. Ontem você acertou 70% dos exercícios de Limites — melhorou 15%. Hoje: 30min de Continuidade (teoria) + 20min de exercícios. Vamos?"*

HexxonAI monitora seu progresso e reajusta o plano se você está acima ou abaixo do esperado. Um único objetivo gera ações em 6+ tabelas do Supabase.

**Outros exemplos de execução direta:**

```
Você: "HexxonAI, acabei de estudar limites por 45 minutos, fiz 6 exercícios e acertei 4"

HexxonAI: "Registrado. Sessão de estudo salva (45 min, exercícios, Cálculo I - Cálculo de limites).
Taxa de acerto: 67%. Seu mastery nesse tópico subiu de 'exposed' para 'developing'.
Os 2 exercícios errados tinham padrão algébrico — vou gerar 3 exercícios focados
nesse tipo de erro para sua próxima sessão. Quer que eu crie agora?"
```

```
Você: "HexxonAI, prepara meu kit de estudo para a P1 de Lógica"

HexxonAI: "Montando seu kit para P1 — Lógica e Conjuntos (15/04/2026):
✓ 8 flashcards gerados (focados em quantificadores — seu ponto fraco)
✓ 5 exercícios criados (3 sobre negação de quantificadores, 2 sobre conjuntos)
✓ Plano de estudo de 20 dias salvo no calendário
✓ Nota de resumo 'Revisão P1 - Lógica' criada no vault

Tudo salvo e pronto. Boa prova, Otávio."
```

**Implementação técnica:**

Expandir o sistema de tools no `orchestrator.ts`. Hoje existem definições de tools, mas a execução real é limitada. A mudança é adicionar tools que chamam diretamente os services existentes:

```typescript
const HEXXONAI_TOOLS = [
  // CRUD direto — conectam aos services em src/lib/services/
  { name: 'create_study_session', service: 'study-sessions', method: 'create' },
  { name: 'create_flashcards_batch', service: 'flashcards', method: 'createBatch' },
  { name: 'create_exercise', service: 'exercises', method: 'create' },
  { name: 'create_note', service: 'notes', method: 'create' },
  { name: 'update_topic_mastery', service: 'disciplines', method: 'updateMastery' },
  { name: 'log_error', service: 'exercises', method: 'classifyAndSave' },
  { name: 'schedule_calendar_event', service: 'study-sessions', method: 'schedule' },

  // Compostos — orquestram múltiplos services numa missão
  { name: 'create_mission', composite: true },        // objetivo → plano completo multi-tabela
  { name: 'prepare_exam_kit', composite: true },       // flashcards + exercises + plan + note
  { name: 'daily_review_setup', composite: true },     // flashcards vencidos + exercícios weak spots
  { name: 'full_topic_onboard', composite: true },     // explain + note + flashcards + exercises
];
```

A chave é que o Claude já sabe usar tool_use — basta registrar os tools corretamente no system prompt e conectar a execução aos services que já existem em `src/lib/services/`. Não precisa reescrever nada, apenas conectar.

**Por que é transformador:** Transforma 8 cliques em 8 páginas diferentes em uma frase natural. Isso não é um chatbot — é um sistema de missão que usa todas as entidades do banco de forma orquestrada. O HEXXONAI do Tony não mostra um menu — ele executa.

---

### 3. ⚡ Consciência Situacional — HexxonAI que Interrompe Quando Importa

**O problema:** O HEXXONAI do Iron Man não espera Tony perguntar "como estão os sistemas?" — ele avisa quando algo precisa de atenção. O HexxonAI 2.0 só fala quando falado.

**O que muda:** Um sistema de alertas inteligentes que roda em background e aparece como notificações contextuais. Mas a diferença entre isso e notificações genéricas é crucial: cada alerta é gerado pela **interseção de múltiplos sinais** — não é "você tem flashcards pendentes" (qualquer app faz isso), é a síntese de vários dados cruzados.

**Tipos de interrupção inteligente:**

**Padrão de erro detectado:**
> *"Você errou 4 exercícios de manipulação algébrica seguidos. Isso indica uma lacuna em fatoração. Quer que eu gere exercícios focados nisso?"*

**Diminishing returns:**
> *"Você está estudando Limites há 50 minutos. Suas respostas corretas caíram de 80% para 40% na última sessão. Sugiro uma pausa ou trocar de tópico."*

**Pré-requisito bloqueante (via knowledge graph):**
> *"Você está tentando estudar Integrais mas Derivadas ainda está em 'exposed'. Integrais depende de Derivadas. Quer que eu prepare uma sessão de Derivadas primeiro?"*

**Flashcard decay com contexto de prova:**
> *"12 flashcards estão vencidos há 3+ dias. Seus flashcards de Teorema de Bolzano estão vencidos E esse teorema cai na prova de sexta E você errou ele no último simulado. 10 minutos agora salvam 30 minutos depois."*

**Prova se aproximando + gaps detectados:**
> *"A P1 de Discreta é em 48h e Lógica Proposicional ainda está em 'developing'. Modo intensivo?"*

**Implementação técnica:**

Nova tabela `hexxon-ai_insights` para os alertas gerados:

```sql
CREATE TABLE hexxon-ai_insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  -- 'readiness_alert', 'weakness_pattern', 'diminishing_returns',
  -- 'prerequisite_blocker', 'flashcard_decay', 'mastery_prediction'
  priority text NOT NULL, -- 'critical', 'high', 'medium', 'low'
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,            -- dados brutos que geraram o insight
  source_tables text[],  -- quais tabelas foram cruzadas
  trigger_event text,    -- o que disparou: 'error_logged', 'session_ended', 'cron_daily', 'page_opened'
  is_read boolean DEFAULT false,
  is_acted_on boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

Uma Supabase Edge Function (`/functions/v1/cognitive-engine`) que roda em duas frequências:
1. **Diária (cron):** Análise completa — provas se aproximando, flashcard decay, readiness scores
2. **Event-driven:** Disparada por triggers no banco — novo erro logado, sessão finalizada, attempt registrado

A engine:
1. Puxa todos os dados cruzados do estudante
2. Envia para o Claude com um system prompt analítico (não conversacional)
3. Gera insights estruturados em JSON
4. Salva na tabela `hexxon-ai_insights`

O dashboard muda: em vez de cards estáticos, mostra os insights mais recentes e urgentes como um "briefing diário" — exatamente como o HEXXONAI faz quando o Tony entra no lab.

**Por que é transformador:** Muda o modelo mental de "eu vou ao app estudar" para "o app vem até mim com o que preciso saber". A diferença entre um calendário e um assistente pessoal. Cada alerta é a síntese de múltiplos sinais — não um lembrete burro.

---

### 4. 🔄 Forgetting Curve Engine — Repetição Espaçada em Tudo

**O problema:** Os flashcards têm `sr_box` (0-4) e `next_review`, mas é um sistema isolado. Um tópico pode ter mastery 'proficient' nos exercícios mas os flashcards estarem esquecidos. Não existe nenhum mecanismo que integre: "você aprendeu limites semana passada, baseado no seu padrão de esquecimento, hoje é o dia ideal para revisar".

**O que muda:** Um sistema de repetição espaçada que não se limita a flashcards — ele orquestra TODO o ciclo de aprendizagem: exercícios, revisão de notas, prática oral, tudo baseado em curvas de esquecimento personalizadas por tópico.

**Como funciona na prática:**

Quando você abre o app, o HexxonAI sabe exatamente o que precisa ser revisado hoje — não só flashcards, mas tudo:

> *"Revisão de hoje (prioridade calculada):*
> 1. *🃏 3 flashcards de Conjuntos (vencidos há 2 dias — risco de esquecimento: 73%)*
> 2. *📝 Releia sua nota 'Quantificadores — ordem importa!' (última leitura: 5 dias, retenção estimada: 45%)*
> 3. *🏋️ 2 exercícios de Composição de Funções (último erro: 2 dias atrás, padrão ainda não consolidado)*
> 4. *🗣️ Pratique a oral question sobre Lógica Proposicional (nunca praticada)*"

**Implementação técnica:**

Duas novas tabelas que unificam todas as interações de aprendizagem:

```sql
-- Registra TODA interação de aprendizagem, de qualquer tipo
CREATE TABLE learning_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id text REFERENCES topics(id),
  event_type text NOT NULL,
  -- 'flashcard_review', 'exercise_attempt', 'note_read',
  -- 'oral_practice', 'explanation_received', 'simulation_question'
  quality integer CHECK (quality >= 0 AND quality <= 5), -- 0=esqueceu totalmente, 5=perfeito
  source_id text,  -- id do flashcard, exercício, nota, etc.
  created_at timestamptz DEFAULT now()
);

-- Estado de memória por tópico (calculado pelo FSRS)
CREATE TABLE topic_memory_state (
  topic_id text PRIMARY KEY REFERENCES topics(id),
  stability real DEFAULT 1.0,    -- dias até 90% de esquecimento
  difficulty real DEFAULT 0.5,   -- 0-1, dificuldade intrínseca para ESTE aluno
  last_review timestamptz,
  next_optimal_review timestamptz,
  retention_estimate real,       -- retenção estimada AGORA
  review_count integer DEFAULT 0
);
```

O algoritmo FSRS (Free Spaced Repetition Scheduler — usado pelo Anki moderno) calcula para cada tópico:
- **Stability:** quantos dias até a retenção cair para 90%
- **Difficulty:** quão difícil é PARA VOCÊ (personalizado por suas respostas)
- **Retention estimada:** dado o tempo desde última revisão, qual % você ainda lembra

Isso alimenta a Consciência Situacional (ideia 3) e o Mission Mode (ideia 2). Tudo conectado.

**Por que é transformador:** Substitui o "eu acho que preciso estudar X" por um cálculo preciso de "a ciência diz que você vai esquecer X amanhã se não revisar hoje". É literalmente o HEXXONAI analisando dados e otimizando performance.

---

### 5. 🎯 Simulado Completo Orquestrado — Exam Simulation Engine

**O problema:** A página de exercícios existe, mas é um ambiente relaxado. Não existe diferença entre "praticar" e "simular uma prova". Uma prova real não é exercícios avulsos — é uma experiência cronometrada, sob pressão, com distribuição específica de tópicos. Quando a P1 chega, é a primeira vez que o aluno enfrenta pressão de tempo + múltiplos tópicos + sem consulta. O resultado: desempenho inferior ao potencial.

**O que muda:** HexxonAI cria e conduz um simulado completo end-to-end:

```
Você: "HexxonAI, simula a P1 de Funções"

HexxonAI: "Entrando em Battle Mode 🎯

P1 — Funções (simulação)
⏱️ Tempo: 1h30min (mesmo da prova real)
📋 5 questões geradas baseadas nos tópicos cobertos
📊 Dificuldade calibrada pelo seu mastery atual
🔒 Sem consulta a notas ou materiais durante a simulação

[INICIAR SIMULAÇÃO]"
```

**As 6 fases do simulado:**

1. **Composição:** Analisa os `assessment_topics`, peso de cada tópico, distribuição de tipos (prova vs. trabalho), e monta uma prova com N questões que reflete o formato real
2. **Execução:** Interface de prova dedicada com timer, navegação entre questões, rascunho por questão. Layout fullscreen — sidebar minimizada, sem botão do HexxonAI
3. **Correção:** Após submissão, HexxonAI corrige cada resposta com `time_spent_sec` por questão, classifica erros
4. **Diagnóstico pós-prova:**

> *"Nota estimada: 6.8/10. Você perdeu 1.5 pontos em erros algébricos e 1.0 em interpretação. Se corrigir erros algébricos, sobe para 8.3."*
>
> *"Padrão detectado: Você trava em composição de funções e gasta tempo demais (22min). Na prova real, pule essa questão, faça as outras, e volte no final."*

5. **Comparação temporal:** Guarda simulados anteriores e mostra evolução: "Simulado #3: 6.8 → Simulado #2: 5.2. Melhora de 31%."
6. **Feedback loop:** Resultados alimentam automaticamente o mastery dos tópicos, a Forgetting Curve, e a Consciência Situacional

**Implementação técnica:**

```sql
CREATE TABLE exam_simulations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id text REFERENCES assessments(id),
  total_time_sec integer NOT NULL,
  time_limit_sec integer NOT NULL,
  score real,
  questions jsonb NOT NULL,
  -- [{exercise_id, answer, is_correct, time_spent_sec, difficulty, error_category}]
  ai_analysis text,          -- análise pós-simulação do Claude
  strategy_tips text[],      -- dicas de estratégia geradas
  readiness_before real,
  readiness_after real,
  created_at timestamptz DEFAULT now()
);
```

Nova rota `/simulacao/[assessmentId]` com:
- Timer com alerta visual nos últimos 10 min
- Geração de questões via `/api/ai/exercises` mas com parâmetros de simulação (dificuldade adaptativa: se mastery é 'developing', questões médias; se 'proficient', questões difíceis)
- Avaliação automática + classificação de erros
- Página de debriefing pós-simulação com comparação temporal

Isso une `exercises` + `attempts` + `error_occurrences` + `assessments` + `topics` num único fluxo coeso. O simulado não é só uma feature — é a prova de fogo que valida se o plano de estudo está funcionando.

**Por que é transformador:** Resolve o problema #1 de quem estuda sozinho: nunca testar sob pressão real. O HEXXONAI do Tony não só treina em ambiente seguro — ele simula cenários de combate reais. O Battle Mode faz o mesmo para provas.

---

### 6. 🌐 Grafo Vivo — Knowledge Graph como Cérebro de Decisão

**O problema:** O knowledge graph hoje é uma visualização. Bonito (26 nós, 22 conceitos, 2 fórmulas, 2 teoremas), mas passivo. Você olha, e ele não faz nada com a informação que contém.

**O que muda:** O grafo se torna a infraestrutura de decisão que fundamenta TODAS as outras ideias. Toda decisão do HexxonAI passa pelo grafo.

**Learning paths otimizados:**

> *HexxonAI: "Para dominar Integrais por Partes, o caminho mais curto no grafo é: Limites (2h) → Derivadas Básicas (3h) → Regra da Cadeia (1.5h) → Integração (2h) → Partes (1h). Total estimado: 9.5h."*

**Blocker detection:** Se um nó com muitos dependentes está fraco, HexxonAI prioriza automaticamente — porque desbloqueia mais progresso. Isso é calculável: um nó com 5 arestas de saída vale mais que um com 1.

**Mastery propagation:** Quando você domina um tópico, HexxonAI verifica se os dependentes agora estão desbloqueados e sugere avançar. "Você dominou Derivadas Básicas. Isso desbloqueia Regra da Cadeia e Derivadas Implícitas. Quer começar por qual?"

**Gap analysis para provas:** Cruza os tópicos da prova com o grafo e identifica não só tópicos fracos, mas pré-requisitos dos tópicos fracos que também precisam de atenção. "Para a P1, Continuidade está fraco. Mas Continuidade depende de Cálculo de Limites, que está em 'exposed'. O bloqueio real está um nível abaixo."

**Overlay visual — GPS de estudo:** No mapa, HexxonAI desenha o learning path como uma rota destacada — os nós que você precisa percorrer iluminam em sequência, estilo GPS. Em vez de um mapa estático de conceitos, você vê SEU caminho personalizado brilhando.

**Implementação técnica:**

O grafo já existe em `kg_nodes` + `kg_edges`. O que falta é uma camada de análise sobre ele:

```typescript
// Novo serviço: src/lib/services/graph-intelligence.ts

// Encontra o caminho ótimo considerando mastery atual
function findLearningPath(targetNodeId: string, nodes: KgNode[], edges: KgEdge[]): LearningPath {
  // Topological sort dos pré-requisitos
  // Filtra apenas nós com mastery < 'proficient'
  // Estima tempo baseado em difficulty + study_sessions históricas
}

// Identifica nós bloqueadores de alto impacto
function findBlockerNodes(assessmentTopics: string[], nodes: KgNode[], edges: KgEdge[]): BlockerNode[] {
  // Para cada tópico da prova com mastery fraco
  // Percorre pré-requisitos recursivamente
  // Ranqueia por (número de dependentes × deficit de mastery)
}

// Verifica desbloqueios após mudança de mastery
function checkUnlocks(updatedNodeId: string, edges: KgEdge[]): UnlockedNode[] {
  // Encontra nós que dependem do atualizado
  // Verifica se todos os pré-requisitos agora estão satisfeitos
}

// Gera dados para overlay visual no mapa
function generatePathOverlay(path: LearningPath): PathOverlayData {
  // Retorna nós + arestas do caminho com metadata visual
  // (cor, ordem, status, tempo estimado)
}
```

O grafo deixa de ser uma tela bonita e vira a infraestrutura de decisão do HexxonAI inteiro — alimentando o Mission Mode (paths ótimos), a Consciência Situacional (blocker detection), e os Simulados (gap analysis).

**Por que é transformador:** É o equivalente do HEXXONAI analisando o campo de batalha e mostrando ao Tony a melhor rota de ataque. O grafo é o "mapa de guerra" que conecta tudo.

---

## O Loop de Integração — Como Tudo se Conecta

As 6 ideias não são features separadas — elas formam um loop que se retroalimenta:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   🌐 Grafo Vivo calcula paths e blockers                    │
│        ↓                                                     │
│   ⚡ Consciência Situacional cruza sinais e gera alertas    │
│        ↓                                                     │
│   🔄 Forgetting Curve calcula o que revisar hoje            │
│        ↓                                                     │
│   👁️ Omnipresença entrega o contexto certo na página certa │
│        ↓                                                     │
│   🎯 Mission Mode orquestra e executa o plano               │
│        ↓                                                     │
│   🎯 Simulado testa sob pressão real                        │
│        ↓                                                     │
│   (resultados alimentam o Grafo + Forgetting Curve)          │
│        ↓                                                     │
│   🌐 Grafo Vivo recalcula tudo...                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Exemplo do loop completo — uma semana na vida do HexxonAI 3.0:**

**Segunda:** Cognitive Engine detecta "P1 de Lógica em 20 dias, mastery médio 'developing', 2 erros não resolvidos". Grafo identifica que Quantificadores bloqueia 3 outros tópicos da prova. HexxonAI gera briefing diário.

**Terça:** Você abre a página de Notas sobre Quantificadores. Omnipresença percebe e HexxonAI oferece: "Gero 5 flashcards dos seus erros + 3 exercícios focados?". Mission Mode executa tudo com um "sim".

**Quarta:** Forgetting Curve calcula que retenção em Conjuntos caiu para 50%. Consciência Situacional cruza: Conjuntos cai na prova + retenção baixa + flashcards vencidos. Alerta aparece no dashboard.

**Quinta:** Você estuda 45min de exercícios. Consciência Situacional detecta diminishing returns (acertos caíram de 80% para 40%). Sugere pausa. Mastery é atualizado, Grafo recalcula desbloqueios.

**Sexta:** HexxonAI reajusta o plano: "Você avançou mais rápido que o esperado em Quantificadores. Remanejei a sessão de sábado para Lógica Proposicional."

**Sábado:** Simulado completo da P1. Score: 7.2/10. Resultados alimentam todas as engines — mastery, forgetting curve, error patterns, readiness score. Grafo atualiza.

**Domingo:** Briefing: "Readiness subiu de 38% para 62% em uma semana. Se manter esse ritmo, chega na P1 com ~85%. Próximo foco: resolver o bloqueio em Álgebra Booleana."

**É um sistema que aprende com você enquanto você aprende com ele.**

---

## Ordem de Implementação Sugerida

| Fase | Ideia | Impacto | Esforço | Por quê nessa ordem |
|------|-------|---------|---------|---------------------|
| 1 | 👁️ Omnipresença | Alto | Baixo | Campos já existem no DB, muda só o `context.ts` + floating button |
| 2 | 🎯 Mission Mode | Altíssimo | Médio | Conecta tools do Claude aos services que já existem |
| 3 | 🌐 Grafo Vivo | Alto | Médio | Novo service de inteligência sobre tabelas que já existem |
| 4 | 🔄 Forgetting Curve | Alto | Médio | Novas tabelas + algoritmo FSRS |
| 5 | ⚡ Consciência Situacional | Altíssimo | Alto | Edge Function + cron + triggers, depende dos dados das fases anteriores |
| 6 | 🎯 Simulado | Alto | Alto | Nova rota + UI dedicada, usa tudo das fases anteriores |

Fases 1 e 2 podem ser feitas em paralelo e já transformam a experiência. Fase 3 fundamenta as decisões das fases 4-6. A Consciência Situacional fica mais poderosa quanto mais dados as outras fases geram.

---

*"Não é sobre construir mais páginas. É sobre construir uma inteligência que conecta todas elas."*

— Visão HexxonAI 3.0, 27 de março de 2026
