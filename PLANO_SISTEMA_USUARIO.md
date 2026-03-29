# Plano: Sistema de Usuário + Onboarding Inteligente

> O objetivo é transformar o cogni. de um app single-user sem auth em uma plataforma multi-user onde o HexxonAI se adapta completamente ao perfil acadêmico de cada estudante.

---

## Estado Atual — O Que Existe e O Que Falta

| Aspecto | Hoje | Alvo |
|---------|------|------|
| Autenticação | Nenhuma. Anon key direto. | Supabase Auth (email + Google OAuth) |
| Isolamento de dados | Zero. Todas as queries são globais. | `user_id` em toda tabela + RLS |
| Onboarding | Inexistente. `/` vai direto pro dashboard. | Landing → Login → Intro → Setup acadêmico → Upload docs → Bootstrap |
| Documentos do usuário | Upload básico em `/materiais` (sem processamento inteligente) | Pipeline completo: upload → extração → indexação → alimenta HexxonAI |
| Personalização | Currículo hardcoded (Cálculo I + Mat. Discreta) | HexxonAI gera currículo baseado nos documentos reais do aluno |
| Multi-tenancy | Impossível (sem user_id) | Cada aluno tem seu universo isolado |

**Infraestrutura que já existe e pode ser aproveitada:**
- `@supabase/ssr` v0.9.0 já instalado (nunca importado)
- Schema `auth.users` existe no Supabase (0 rows)
- Supabase Storage está disponível (bucket de materiais já parcialmente usado)
- Service layer em `src/lib/services/` pronto para receber `userId` como parâmetro

---

## O Fluxo Completo do Usuário

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  1. LANDING PAGE                                                    │
│     └─→ Apresenta o cogni. + CTA "Começar"                        │
│                                                                     │
│  2. LOGIN / REGISTRO                                                │
│     └─→ Email + senha  OU  Google OAuth                            │
│     └─→ Se primeiro acesso → vai para onboarding                   │
│     └─→ Se já tem conta → vai para dashboard                      │
│                                                                     │
│  3. INTRO DO HEXXONAI (só no primeiro acesso)                        │
│     └─→ Tela imersiva explicando as capacidades do HexxonAI          │
│     └─→ "Eu sou o HexxonAI. Vou ser seu copiloto de estudo."        │
│                                                                     │
│  4. SETUP ACADÊMICO                                                 │
│     └─→ Qual faculdade?                                            │
│     └─→ Qual curso?                                                │
│     └─→ Quantos semestres tem o curso?                             │
│     └─→ Em qual semestre você está?                                │
│     └─→ Quais disciplinas está cursando agora?                     │
│         (nomes, professores, horários, datas de provas se souber)   │
│                                                                     │
│  5. UPLOAD DE DOCUMENTOS (a etapa mais importante)                  │
│     └─→ UI instrui claramente o que enviar:                        │
│         • Planos de ensino / ementas                               │
│         • Listas de exercícios                                      │
│         • Slides de aula                                            │
│         • Livros-texto (PDF)                                        │
│         • Notas de aula do professor                               │
│         • Provas anteriores                                         │
│         • Qualquer material relevante                              │
│     └─→ Drag & drop com categorização automática                   │
│     └─→ Barra de progresso do processamento                        │
│                                                                     │
│  6. HEXXONAI BOOTSTRAP                                                │
│     └─→ HexxonAI processa todos os documentos                        │
│     └─→ Extrai: tópicos, cronograma, fórmulas, pré-requisitos     │
│     └─→ Gera automaticamente:                                      │
│         • Disciplinas com módulos e tópicos                        │
│         • Knowledge graph inicial                                   │
│         • Assessments (provas/trabalhos do plano de ensino)        │
│         • Flashcards iniciais dos conceitos-chave                  │
│     └─→ Mostra ao usuário o que gerou com opção de editar          │
│                                                                     │
│  7. DASHBOARD (sistema normal)                                      │
│     └─→ Tudo populado e pronto para usar                          │
│     └─→ Área permanente para adicionar novos documentos            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1 — Autenticação + Multi-tenancy

### 1.1 Supabase Auth

O Supabase Auth já está provisionado no projeto (schema `auth` existe). Precisamos ativá-lo.

**Provedores de login:**
- Email + senha (padrão)
- Google OAuth (conveniência — a maioria dos universitários tem Gmail)

**Implementação no Next.js:**

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts      ← createBrowserClient() para client components
│       ├── server.ts      ← createServerClient() para server components e API routes
│       └── middleware.ts   ← helper para refresh de token
├── middleware.ts           ← protege rotas, redireciona se não autenticado
├── app/
│   ├── (auth)/             ← grupo de rotas públicas (sem sidebar, sem auth)
│   │   ├── layout.tsx      ← layout limpo, sem sidebar
│   │   ├── page.tsx        ← LANDING PAGE
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   ├── (app)/              ← grupo de rotas protegidas (com sidebar, requer auth)
│   │   ├── layout.tsx      ← layout com sidebar + HexxonAiProvider + auth check
│   │   ├── page.tsx        ← DASHBOARD (antigo /)
│   │   ├── hexxon-ai/
│   │   ├── exercicios/
│   │   └── ... (todas as rotas atuais)
│   ├── onboarding/         ← fluxo de primeiro acesso
│   │   ├── layout.tsx      ← layout limpo, fullscreen, com stepper
│   │   ├── intro/page.tsx
│   │   ├── academico/page.tsx
│   │   ├── documentos/page.tsx
│   │   └── bootstrap/page.tsx
│   └── auth/
│       └── callback/route.ts  ← callback do OAuth
```

**Middleware (`src/middleware.ts`):**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie handlers */ } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Rotas públicas — não precisa de auth
  if (path === '/' || path.startsWith('/login') || path.startsWith('/registro') || path.startsWith('/auth/')) {
    if (user) {
      // Se já logado, verifica se completou onboarding
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (!profile?.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding/intro', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // Rotas de onboarding — precisa de auth mas NÃO de onboarding completo
  if (path.startsWith('/onboarding')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    return response
  }

  // Todas as outras rotas — precisa de auth E onboarding completo
  if (!user) return NextResponse.redirect(new URL('/', request.url))

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) {
    return NextResponse.redirect(new URL('/onboarding/intro', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)']
}
```

### 1.2 Tabela `user_profiles`

```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Dados pessoais
  full_name text NOT NULL,
  avatar_url text,

  -- Dados acadêmicos
  university text NOT NULL,           -- 'PUCRS'
  course text NOT NULL,               -- 'Ciência da Computação'
  total_semesters integer NOT NULL,   -- 8
  current_semester integer NOT NULL,  -- 1
  enrollment_year text,               -- '2026/1'

  -- Estado do onboarding
  onboarding_completed boolean DEFAULT false,
  onboarding_step text DEFAULT 'intro',
  -- 'intro' | 'academico' | 'documentos' | 'bootstrap' | 'completed'

  -- Preferências
  theme text DEFAULT 'dark',
  ai_model_preference text DEFAULT 'claude-sonnet',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### 1.3 Migração: Adicionar `user_id` a Todas as Tabelas

Cada tabela existente ganha uma coluna `user_id` com RLS:

```sql
-- Padrão repetido para CADA tabela pública
-- (disciplines, modules, topics, assessments, assessment_topics,
--  exercises, attempts, error_occurrences, notes, flashcards,
--  oral_questions, study_sessions, kg_nodes, kg_edges,
--  conversations, ai_usage_logs)

ALTER TABLE disciplines ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own disciplines"
  ON disciplines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own disciplines"
  ON disciplines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own disciplines"
  ON disciplines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own disciplines"
  ON disciplines FOR DELETE USING (auth.uid() = user_id);

-- Repetir para CADA tabela...
```

**Impacto no código:** Toda chamada ao Supabase em `src/lib/services/` precisa:
1. Receber o `userId` (vindo da sessão autenticada)
2. Incluir `.eq('user_id', userId)` nas queries (ou confiar no RLS)
3. Incluir `user_id` nos inserts

O RLS faz o filtro automaticamente se o Supabase client tiver o token do usuário autenticado. Então na prática, se o client for criado corretamente com `@supabase/ssr`, as queries existentes continuam funcionando — o RLS filtra invisívelmente.

---

## Fase 2 — Landing Page + Login

### 2.1 Landing Page (`/`)

Página pública que apresenta o cogni. Estilo hero section + features:

**Estrutura:**
- Hero: "Seu copiloto de estudo com inteligência artificial" + CTA "Começar grátis"
- Seção de features visuais (HexxonAI, Mapa de Conhecimento, Simulados, etc.)
- Footer com link para login

**Detalhes de design:** Manter o dark theme atual. Animações sutis. Mobile-first. Sem sidebar.

### 2.2 Login/Registro (`/login`, `/registro`)

**Registro:**
- Email + senha + nome completo
- OU botão "Continuar com Google"
- Após registro, cria `user_profiles` com `onboarding_completed = false`
- Redireciona para `/onboarding/intro`

**Login:**
- Email + senha OU Google
- Se `onboarding_completed = false`, redireciona para onde parou
- Se `onboarding_completed = true`, redireciona para `/dashboard`

---

## Fase 3 — Fluxo de Onboarding

### 3.1 Tela de Introdução do HexxonAI (`/onboarding/intro`)

Tela imersiva, fullscreen, estilo "cinematic intro":

O HexxonAI se apresenta ao usuário. Pode ser uma animação simples com texto aparecendo progressivamente:

> *"Olá, [nome]. Eu sou o HexxonAI.*
>
> *Vou ser seu copiloto de estudo durante toda a faculdade. Eu analiso seus materiais, identifico suas fraquezas, planejo suas revisões e simulo suas provas.*
>
> *Mas primeiro, preciso te conhecer.*
>
> *Quanto mais informação você me der agora, melhor eu vou poder te ajudar."*

Botão: **"Vamos lá"** → avança para setup acadêmico.

**UI:** Fundo escuro, texto branco aparecendo com animação de typing, ícone do HexxonAI sutil. Sem sidebar, sem distrações.

### 3.2 Setup Acadêmico (`/onboarding/academico`)

Formulário com stepper visual (Etapa 2 de 4):

**Campos:**

| Campo | Tipo | Exemplo | Obrigatório |
|-------|------|---------|-------------|
| Faculdade | Text input com autocomplete | PUCRS | Sim |
| Curso | Text input com autocomplete | Ciência da Computação | Sim |
| Total de semestres | Number select | 8 | Sim |
| Semestre atual | Number select (1 até total) | 1 | Sim |
| Período letivo | Text | 2026/1 | Sim |

**Disciplinas do semestre (dinâmico — adiciona quantas quiser):**

Para cada disciplina:
| Campo | Tipo | Exemplo |
|-------|------|---------|
| Nome | Text | Cálculo I |
| Professor(a) | Text | Prof. Maria Silva |
| Horários | Multi-select (dias + turnos) | Seg/Qua manhã |
| Tem prova? Quantas? | Number | 2 |
| Datas das provas (se souber) | Date pickers | 13/04, 15/06 |
| Método de avaliação (se souber) | Text | P1(30%) + P2(30%) + T(40%) |

Botão "+ Adicionar disciplina" para quantas forem necessárias.

**Salva em:** `user_profiles` (dados acadêmicos) + cria registros iniciais em `disciplines` (com `user_id`).

### 3.3 Upload de Documentos (`/onboarding/documentos`)

**Esta é a etapa mais importante do onboarding.** A UI deve ser extremamente clara sobre o que enviar.

**Layout da página:**

Header com mensagem do HexxonAI:
> *"Agora preciso dos seus materiais. Quanto mais você me enviar, melhor eu consigo montar seu plano de estudo. Não se preocupe em organizar — eu faço isso."*

**Área de upload por disciplina:**

Para cada disciplina cadastrada na etapa anterior, uma seção com:

```
┌─────────────────────────────────────────────────────┐
│  📚 Cálculo I — Prof. Maria Silva                   │
│                                                     │
│  Envie tudo que tiver para essa disciplina:         │
│                                                     │
│  ☐ Plano de ensino / ementa                        │
│  ☐ Slides de aula                                  │
│  ☐ Listas de exercícios                            │
│  ☐ Livro-texto (PDF)                               │
│  ☐ Provas anteriores                               │
│  ☐ Notas de aula do professor                      │
│  ☐ Gabaritos / resoluções                          │
│  ☐ Outros materiais                                │
│                                                     │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│  │  📎 Arraste arquivos aqui ou clique           │   │
│  │     PDF, DOCX, PPTX, PNG, JPG                │   │
│  │     Até 50MB por arquivo                      │   │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
│                                                     │
│  Arquivos enviados:                                 │
│  ✅ Plano_Ensino_Calculo.pdf (2.3 MB) — Ementa    │
│  ✅ Slides_Aula01_Funcoes.pptx (5.1 MB) — Slides  │
│  ⏳ Processando: Lista1_Limites.pdf ...             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Checklist visual:** Os tipos de documento listados servem como "guia" para o aluno lembrar o que tem. Conforme ele envia, os checkboxes marcam automaticamente (via classificação do HexxonAI).

**Classificação automática:** Ao fazer upload, o HexxonAI classifica o tipo do documento (ementa, lista, slides, prova antiga, etc.) via Claude. O usuário pode corrigir a classificação se errada.

**Mensagem de incentivo:** Se o aluno envia poucos documentos:
> *"Você enviou 2 documentos para Cálculo I. Quanto mais materiais eu tiver, melhor posso mapear os tópicos e gerar exercícios relevantes. Tem mais alguma coisa?"*

Botão: **"Pronto, processe tudo"** → avança para bootstrap.

### 3.4 Bootstrap do HexxonAI (`/onboarding/bootstrap`)

**Esta é a etapa onde a mágica acontece.**

Tela de loading com progresso detalhado:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  🧠 HexxonAI está analisando seus materiais...        │
│                                                     │
│  ████████████░░░░░░░░ 60%                           │
│                                                     │
│  ✅ Documentos lidos e classificados                │
│  ✅ Tópicos extraídos de cada disciplina            │
│  ⏳ Montando knowledge graph...                     │
│  ○  Gerando assessments do plano de ensino          │
│  ○  Criando flashcards iniciais                     │
│  ○  Configurando currículo personalizado            │
│                                                     │
│  Tempo estimado: ~2 minutos                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**O que o HexxonAI faz por trás (pipeline):**

```
Documentos enviados
    │
    ▼
[1] EXTRAÇÃO DE TEXTO
    • PDF → texto via pdf-parse ou pdfjs
    • PPTX → texto via officegen/xml parsing
    • DOCX → texto via mammoth
    • Imagens → OCR se necessário
    │
    ▼
[2] CLASSIFICAÇÃO + ANÁLISE (Claude)
    • Tipo do documento (ementa, lista, slides, prova, livro)
    • Disciplina associada (confirma ou corrige)
    • Extrai estrutura:
      - Ementa → tópicos, cronograma, método de avaliação, bibliografia
      - Lista → exercícios com enunciados
      - Slides → conceitos-chave por aula
      - Prova antiga → questões + tópicos cobertos
      - Livro → índice, capítulos relevantes
    │
    ▼
[3] GERAÇÃO DO CURRÍCULO (Claude)
    Input: tópicos extraídos + semestre + curso + cronograma
    Output estruturado (JSON):
    • Disciplinas com módulos e tópicos ordenados
    • Pré-requisitos entre tópicos (para o knowledge graph)
    • Assessments com datas e tópicos cobertos
    • Dificuldade estimada por tópico
    │
    ▼
[4] POPULAÇÃO DO BANCO
    • INSERT disciplines, modules, topics (com user_id)
    • INSERT kg_nodes, kg_edges (knowledge graph)
    • INSERT assessments, assessment_topics
    • INSERT flashcards iniciais (conceitos-chave)
    • INSERT materials (referências aos documentos)
    │
    ▼
[5] REVISÃO DO USUÁRIO
    • Mostra o que foi gerado
    • Usuário pode editar/remover/adicionar
    • Confirma → onboarding_completed = true
```

### 3.5 Tela de Revisão (`/onboarding/bootstrap` — segunda fase)

Após o processamento, o HexxonAI mostra ao usuário o que gerou:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ✅ HexxonAI configurou seu sistema!                  │
│                                                     │
│  Aqui está o que eu montei baseado nos seus         │
│  materiais. Revise e ajuste o que precisar.         │
│                                                     │
│  📚 Cálculo I (13 tópicos · 2 provas · 1 trabalho) │
│     ├─ Módulo 1: Funções                           │
│     │  ├─ Conceito de função         [✏️] [🗑️]     │
│     │  ├─ Domínio e imagem           [✏️] [🗑️]     │
│     │  └─ Funções elementares        [✏️] [🗑️]     │
│     ├─ Módulo 2: Limites                           │
│     │  ├─ Definição de limite        [✏️] [🗑️]     │
│     │  └─ Cálculo de limites         [✏️] [🗑️]     │
│     └─ ...                                         │
│     [+ Adicionar tópico]                            │
│                                                     │
│     Provas detectadas:                              │
│     ├─ P1 — Funções e Limites (13/04) [✏️]         │
│     └─ P2 — Derivadas e Integrais (15/06) [✏️]     │
│     [+ Adicionar avaliação]                         │
│                                                     │
│  📐 Matemática Discreta (12 tópicos · 2 provas)    │
│     └─ ...                                         │
│                                                     │
│  🌐 Knowledge Graph: 25 nós, 18 conexões           │
│     [Visualizar mapa]                               │
│                                                     │
│  🃏 15 flashcards iniciais gerados                  │
│     [Ver flashcards]                                │
│                                                     │
│  ──────────────────────────────────────────         │
│  [Está tudo certo? Começar a usar o cogni.]         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Cada item é editável:** O usuário pode renomear tópicos, mudar datas de provas, adicionar módulos que o HexxonAI não detectou, remover flashcards que não fazem sentido. Isso é crítico — o HexxonAI propõe, o humano confirma.

---

## Fase 4 — Sistema de Documentos Persistente

### 4.1 Tabelas de Documentos

```sql
-- Documentos do usuário (arquivos reais no Supabase Storage)
CREATE TABLE user_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discipline_id text REFERENCES disciplines(id),

  -- Arquivo
  file_name text NOT NULL,
  file_path text NOT NULL,              -- path no Supabase Storage
  file_size integer NOT NULL,           -- bytes
  mime_type text NOT NULL,

  -- Classificação (gerada pelo HexxonAI, editável pelo usuário)
  doc_type text NOT NULL,
  -- 'syllabus', 'exercise_list', 'slides', 'textbook', 'past_exam',
  -- 'lecture_notes', 'solution_key', 'other'
  doc_type_confidence real,             -- 0-1, confiança da classificação

  -- Processamento
  processing_status text DEFAULT 'pending',
  -- 'pending', 'extracting', 'analyzing', 'indexed', 'failed'
  extracted_text text,                  -- texto extraído do documento
  ai_analysis jsonb,                   -- análise estruturada do Claude
  -- {topics: [...], key_concepts: [...], exercises: [...], dates: [...]}
  page_count integer,
  word_count integer,

  -- Metadados
  uploaded_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  source text DEFAULT 'onboarding',    -- 'onboarding' | 'materiais_page' | 'hexxon-ai'

  -- Versionamento (professor manda v2 de uma lista)
  replaces_document_id uuid REFERENCES user_documents(id),
  version integer DEFAULT 1
);

-- RLS
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own documents"
  ON user_documents FOR ALL USING (auth.uid() = user_id);

-- Chunks para busca semântica futura (RAG)
CREATE TABLE document_chunks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES user_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  chunk_index integer NOT NULL,
  content text NOT NULL,
  token_count integer,

  -- Metadados do chunk
  page_number integer,
  section_title text,
  chunk_type text,                     -- 'text', 'exercise', 'definition', 'theorem', 'example'

  -- Embedding para busca semântica (futuro)
  -- embedding vector(1536),

  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own chunks"
  ON document_chunks FOR ALL USING (auth.uid() = user_id);
```

### 4.2 Supabase Storage

```
Bucket: user-documents
├── {user_id}/
│   ├── onboarding/           ← documentos do onboarding
│   │   ├── calculo-i/
│   │   │   ├── plano_ensino.pdf
│   │   │   └── slides_aula01.pptx
│   │   └── mat-discreta/
│   │       └── lista1.pdf
│   └── ongoing/              ← documentos adicionados depois
│       ├── calculo-i/
│       │   └── lista2_limites.pdf
│       └── mat-discreta/
│           └── prova_anterior_2025.pdf
```

### 4.3 Pipeline de Processamento

**API Route: `POST /api/documents/process`**

```typescript
// Fluxo simplificado
async function processDocument(docId: string, userId: string) {
  // 1. Baixar arquivo do Storage
  const file = await supabase.storage.from('user-documents').download(filePath)

  // 2. Extrair texto baseado no mime_type
  let text: string
  switch (mimeType) {
    case 'application/pdf':
      text = await extractPdfText(file)      // pdf-parse
      break
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      text = await extractPptxText(file)     // xml parsing
      break
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      text = await extractDocxText(file)     // mammoth
      break
    case 'image/png': case 'image/jpeg':
      text = await ocrImage(file)            // Claude vision
      break
  }

  // 3. Classificar e analisar via Claude
  const analysis = await analyzeDocument(text, disciplineContext)
  // Retorna: { doc_type, topics, key_concepts, exercises, dates, confidence }

  // 4. Chunkar para busca futura
  const chunks = chunkText(text, { maxTokens: 500, overlap: 50 })

  // 5. Salvar tudo
  await updateDocument(docId, { extracted_text: text, ai_analysis: analysis, processing_status: 'indexed' })
  await insertChunks(docId, userId, chunks)

  // 6. Se é onboarding, alimentar o bootstrap
  return analysis
}
```

### 4.4 Área de Documentos Dentro do App

A página `/materiais` ganha uma seção "Meus Documentos" permanente onde o usuário pode adicionar novos materiais a qualquer momento:

```
┌─────────────────────────────────────────────────────┐
│  📁 Meus Documentos                                 │
│                                                     │
│  Cálculo I (5 documentos)                           │
│  ├─ 📄 Plano de Ensino        Ementa    ✅ Indexado │
│  ├─ 📄 Slides Aula 01-03      Slides    ✅ Indexado │
│  ├─ 📄 Lista 1 — Funções      Exercícios ✅ Indexado│
│  ├─ 📄 Lista 2 — Limites      Exercícios ⏳ Novo   │
│  └─ 📄 Stewart Cap. 1-3       Livro     ✅ Indexado │
│                                                     │
│  [+ Enviar novos documentos]                        │
│                                                     │
│  Matemática Discreta (3 documentos)                 │
│  └─ ...                                             │
└─────────────────────────────────────────────────────┘
```

**Quando um novo documento é adicionado:**
1. Upload → processamento automático (mesma pipeline)
2. HexxonAI analisa o conteúdo
3. Se detecta novos tópicos que não estão no currículo → sugere adição
4. Se detecta exercícios → oferece importar para a página de exercícios
5. Se detecta datas de provas → oferece criar/atualizar assessments
6. Notificação contextual: "Novo material processado. Detectei 3 tópicos novos sobre Limites no Infinito. Quer que eu adicione ao seu currículo?"

---

## Fase 5 — Bootstrap Inteligente do HexxonAI

### 5.1 API Route: `POST /api/onboarding/bootstrap`

O endpoint mais complexo do sistema. Recebe os dados acadêmicos + análises dos documentos e gera o currículo completo.

```typescript
async function bootstrapSystem(userId: string, academicProfile: AcademicProfile, documentAnalyses: DocumentAnalysis[]) {

  // 1. Consolidar informações de todos os documentos
  const consolidatedTopics = mergeTopicsFromDocuments(documentAnalyses)
  const detectedDates = extractDatesFromDocuments(documentAnalyses)
  const detectedPrereqs = inferPrerequisites(consolidatedTopics)

  // 2. Enviar para Claude gerar o currículo estruturado
  const curriculum = await generateCurriculum({
    university: academicProfile.university,
    course: academicProfile.course,
    semester: academicProfile.current_semester,
    disciplines: academicProfile.disciplines,
    topics: consolidatedTopics,
    dates: detectedDates,
    prerequisites: detectedPrereqs,
  })
  // Retorna JSON com: disciplines[], modules[], topics[], assessments[],
  //   kg_nodes[], kg_edges[], initial_flashcards[]

  // 3. Popular o banco de dados
  await insertDisciplines(userId, curriculum.disciplines)
  await insertModules(userId, curriculum.modules)
  await insertTopics(userId, curriculum.topics)
  await insertAssessments(userId, curriculum.assessments)
  await insertKnowledgeGraph(userId, curriculum.kg_nodes, curriculum.kg_edges)
  await insertFlashcards(userId, curriculum.initial_flashcards)

  // 4. Marcar onboarding como quase completo (falta revisão)
  await updateProfile(userId, { onboarding_step: 'review' })

  return curriculum // para exibir na tela de revisão
}
```

### 5.2 System Prompt para o Claude no Bootstrap

```
Você é o motor de curricularização do cogni. Recebeu os documentos acadêmicos de um estudante
e precisa gerar um currículo estruturado e completo.

DADOS DO ALUNO:
- Universidade: {university}
- Curso: {course}
- Semestre: {current_semester}/{total_semesters}
- Período: {enrollment_year}

DISCIPLINAS INFORMADAS:
{disciplines com professores, horários, etc.}

ANÁLISE DOS DOCUMENTOS ENVIADOS:
{consolidação de todos os document analyses}

GERE UM JSON com a seguinte estrutura:
{
  "disciplines": [...],      // disciplinas com slug, professor, horários
  "modules": [...],          // módulos por disciplina, ordenados cronologicamente
  "topics": [...],           // tópicos por módulo com estimativa de dificuldade
  "assessments": [...],      // provas/trabalhos com datas e tópicos cobertos
  "kg_nodes": [...],         // nós do knowledge graph (conceitos, fórmulas, teoremas)
  "kg_edges": [...],         // arestas (pré-requisitos, relações)
  "initial_flashcards": [...]// 3-5 flashcards por tópico (conceitos fundamentais)
}

REGRAS:
- Tópicos devem seguir a ordem do plano de ensino/ementa se disponível
- Pré-requisitos devem ser inferidos da lógica matemática/conceitual
- Flashcards devem focar em definições e conceitos-chave, não em cálculos
- Dificuldade estimada: 1-5 (baseada no semestre do aluno e natureza do tópico)
- Se informação conflitar entre documentos, priorizar: ementa > slides > livro
```

---

## Fase 6 — O HexxonAI Usa os Documentos Continuamente

O sistema de documentos não é só para o onboarding — é uma fonte permanente de conhecimento para o HexxonAI.

### 6.1 Contexto Documental nas Respostas

Quando o HexxonAI responde perguntas ou gera conteúdo, ele pode referenciar os documentos do aluno:

> *"Sobre limites no infinito, seu livro (Stewart Cap. 2.6) define como... E nos slides da Aula 05, o professor apresentou o método..."*

**Implementação:** Os `document_chunks` são buscados por relevância (inicialmente keyword match, futuramente embeddings) e injetados no contexto do Claude.

### 6.2 Detecção de Novo Conteúdo

Quando o aluno adiciona um novo documento (ex: professor mandou Lista 3):

1. Pipeline processa o documento
2. HexxonAI compara com o currículo existente
3. Detecta: novos tópicos? novos exercícios? mudança de datas?
4. Gera insight proativo: "A Lista 3 cobre Continuidade e Derivadas. Continuidade já está no seu currículo mas Derivadas não. Quer que eu adicione o módulo de Derivadas?"
5. Se o aluno confirma, o sistema se atualiza

### 6.3 Exercícios Baseados nos Materiais Reais

Em vez de gerar exercícios genéricos, o HexxonAI pode:
- Usar exercícios das listas do professor como base
- Gerar variações dos exercícios das provas anteriores
- Referencia os slides quando explica um conceito

---

## Ordem de Implementação

| Fase | O que | Esforço | Bloqueios |
|------|-------|---------|-----------|
| **1.1** | Supabase Auth (email + Google) | Médio | Nenhum |
| **1.2** | Tabela `user_profiles` + middleware | Médio | 1.1 |
| **1.3** | Migração: `user_id` + RLS em todas as tabelas | Alto | 1.1 |
| **1.4** | Atualizar todos os services para usar auth client | Alto | 1.3 |
| **2.1** | Landing page | Baixo | Nenhum (pode ser paralelo) |
| **2.2** | Páginas de login/registro | Médio | 1.1 |
| **3.1** | Tela intro do HexxonAI | Baixo | 2.2 |
| **3.2** | Setup acadêmico (formulário) | Médio | 1.2 |
| **3.3** | Upload de documentos (UI + Storage) | Alto | 1.2 |
| **3.4** | Pipeline de processamento de documentos | Alto | 3.3 |
| **3.5** | Bootstrap do HexxonAI (geração de currículo) | Alto | 3.4 |
| **3.6** | Tela de revisão do bootstrap | Médio | 3.5 |
| **4.1** | Área permanente de documentos em `/materiais` | Médio | 3.3 |
| **4.2** | Detecção de conteúdo novo + sugestões | Médio | 3.4, HexxonAI 3.0 |
| **5.1** | Contexto documental no HexxonAI | Alto | 3.4, document_chunks |

**Caminho crítico:** 1.1 → 1.2 → 1.3 → 1.4 (auth funcionando) → 2.2 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6

**Paralelo:** Landing page (2.1) + Intro do HexxonAI (3.1) podem ser feitas a qualquer momento.

---

## Decisões Arquiteturais Importantes

### Auth: Por que Supabase Auth e não NextAuth/Clerk?

- Já está provisionado no projeto (schema `auth` existe)
- `@supabase/ssr` já está instalado
- RLS depende de `auth.uid()` — funciona nativamente com Supabase Auth
- Zero custo adicional (grátis no Free Tier até 50k MAUs)
- Google OAuth configurável direto no Supabase Dashboard

### Processamento de documentos: Server-side ou Edge Function?

**Recomendação: API Routes do Next.js (server-side)**
- Documentos grandes (livros PDF) podem demorar para processar
- API Routes com timeout de 60s na Vercel (Pro) ou 10s (Hobby)
- Para documentos grandes, usar Supabase Edge Functions (timeout de 150s) ou background job

**Alternativa futura:** Fila de processamento com Supabase Edge Functions + pg_cron para documentos muito grandes.

### Bootstrap: Uma chamada grande ou várias pequenas ao Claude?

**Recomendação: Várias chamadas menores, orquestradas**
- Uma chamada por documento (classificação)
- Uma chamada de consolidação (merge de tópicos + geração de currículo)
- Uma chamada por disciplina (flashcards iniciais)

Motivo: chamadas menores são mais confiáveis, mais fáceis de debugar, e permitem mostrar progresso ao usuário.

### Dados do onboarding vs. dados do aluno

**Regra fundamental:** O HexxonAI propõe, o humano confirma. Tudo que o bootstrap gerar deve ser editável pelo usuário antes e depois. O campo `source` em cada entidade rastreia se foi gerado pelo HexxonAI ou criado manualmente.

---

*"O primeiro contato define a relação. Se o onboarding for mágico, o aluno confia no HexxonAI pro resto do semestre."*

— Plano Sistema de Usuário, 27 de março de 2026
