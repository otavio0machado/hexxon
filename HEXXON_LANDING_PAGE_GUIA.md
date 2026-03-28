# Hexxon — Guia de Recriação da Landing Page

> Este documento contém tudo que você precisa para recriar a landing page do Hexxon do zero usando o Claude.
> Gerado em: 28/03/2026

---

## 1. Pré-requisitos

O projeto deve ter:
- Next.js 16+ (App Router)
- TypeScript
- Tailwind CSS v4
- `framer-motion` instalado
- `lucide-react` instalado

---

## 2. Comando de setup (se ainda não tiver framer-motion)

```bash
cd study-app
npm install framer-motion
```

---

## 3. Arquivo de destino

```
src/app/(auth)/page.tsx
```

---

## 4. Design Tokens obrigatórios (globals.css)

O CSS do projeto deve expor estas variáveis para o Tailwind:

```
Backgrounds:  bg-bg-primary (#09090b), bg-bg-secondary (#111318), bg-bg-tertiary (#1a1d24), bg-bg-surface (#14161c)
Text:         text-fg-primary (#f0f4f8), text-fg-secondary (#94a3b8), text-fg-tertiary (#64748b), text-fg-muted (#334155)
Borders:      border-border-default (#1e293b), border-border-subtle, border-border-focus (#06b6d4)
Accent:       bg-accent-primary (#06b6d4 — cyan)
Brand:        linear-gradient(135deg, #1d4ed8, #06b6d4, #10b981) — blue → cyan → green
```

---

## 5. Prompt completo para o Claude

Cole o bloco abaixo inteiro em uma nova conversa com o Claude:

---

### INÍCIO DO PROMPT

```
Você é um desenvolvedor frontend sênior. Preciso que crie a landing page do Hexxon, um Learning OS com IA integrada.

O resultado deve ser um ÚNICO arquivo: src/app/(auth)/page.tsx

REGRAS DE QUALIDADE — o resultado NÃO pode parecer gerado por IA:
- Copy direta, com opinião, sem marketing genérico. Exemplos de frases reais no app: "O Hexxon não é um chatbot. É seu copiloto de semestre.", "Você vai continuar estudando no escuro?", "Cada feature resolve um problema real."
- Layouts assimétricos. Nem tudo centralizado. Usar grids como 2/5 cols.
- Animações comedidas — um único wrapper FadeIn reutilizável com whileInView, sem whileHover em tudo, sem glow/pulse em botões
- Descrições de features com cenários concretos, não frases vagas

STACK:
- Next.js 16 App Router + TypeScript
- Tailwind CSS v4 (dark theme)
- framer-motion (já instalado)
- lucide-react (já instalado)
- Tudo em UM arquivo, "use client" no topo

DESIGN TOKENS disponíveis como classes Tailwind:
- Backgrounds: bg-bg-primary (#09090b), bg-bg-secondary (#111318), bg-bg-tertiary (#1a1d24)
- Text: text-fg-primary (#f0f4f8), text-fg-secondary (#94a3b8), text-fg-tertiary (#64748b), text-fg-muted (#334155)
- Borders: border-border-default (#1e293b), border-border-focus (#06b6d4)
- Accent: accent-primary (#06b6d4 — cyan)
- Brand gradient inline: linear-gradient(135deg, #1d4ed8, #06b6d4, #10b981)
- Para cores extras, usar Tailwind padrão (blue-600, cyan-500, emerald-400, etc.)

LINKS de navegação:
- Login: /login
- Registro: /registro

ESTRUTURA DA PÁGINA (scroll de cima para baixo):

1. SCROLL PROGRESS BAR
   - Barra de 2px fixa no topo, z-60
   - Usa useScroll + useSpring do framer-motion
   - Gradiente brand (blue → cyan → green)

2. HEADER STICKY
   - Logo: ícone quadrado com gradiente + texto "hexxon" (minúsculo, sem caps lock)
   - Nav central com 4 links âncora: IA, Recursos, Fluxo, Prévia
   - Botões: "Entrar" (link /login, texto simples) e "Criar conta" (link /registro, botão sólido bg-fg-primary)
   - Fundo transparente → bg-bg-primary/70 com backdrop-blur-xl ao scrollar
   - Menu mobile com hamburger

3. HERO
   - SEM o nome "HEXXON" gigante em gradiente animado (isso é clichê)
   - Badge pequeno no topo: dot verde pulsando + "Sistema de estudo com IA integrada"
   - Título grande: "Estude com quem entende como você aprende" — só a palavra "entende" em gradiente brand
   - Usar text-[clamp(2.5rem,7vw,4.5rem)] para tipografia fluida
   - Parágrafo: "O Hexxon monta seu plano de estudo, gera exercícios nos seus pontos fracos e te avisa quando está na hora de revisar. Tudo automático."
   - 2 CTAs: "Começar grátis" (gradiente brand, com ícone ArrowUpRight) e "Como funciona" (outline, ícone ChevronDown)
   - Parallax: o conteúdo do hero faz fade-out e sobe ao scrollar (useScroll + useTransform no ref da section)
   - Hexágonos wireframe flutuando no fundo: clip-path hexagonal, border 1px rgba(6,182,212,0.08), background quase transparente, animação y: [-12, 12] em loop suave. 4 unidades, tamanhos e posições diferentes. SEM rotação, SEM glow.
   - Glow ambiente sutil: div circular, blur-[160px], opacity-[0.07], radial-gradient de cyan
   - Seta de scroll hint no bottom

4. SEÇÃO "HEXXON AI" (id="ia")
   - Label: "INTELIGÊNCIA ARTIFICIAL" em uppercase, text-accent-primary, text-sm
   - Título: "O Hexxon não é um chatbot. É seu copiloto de semestre."
   - Subtítulo: "Ele entende o contexto do que você está fazendo, age sem precisar pedir, e executa tarefas que normalmente levariam horas."
   - Grid lg:grid-cols-5 — lado esquerdo (2 cols) com 4 capabilities, lado direito (3 cols) com chat mockup
   - Capabilities (com ícones Eye, Zap, Wrench, Sparkles):
     - Omnipresente: "Sabe o que você está estudando, em qual página, há quanto tempo."
     - Proativo: "Não espera. Se detecta padrão de erro ou fadiga, interrompe."
     - Executor: "Não só responde: cria flashcards, monta provas, registra sessões."
     - 35+ ferramentas: "Conectado a todo o sistema — de repetição espaçada a simulados."
   - Cada capability: ícone em caixa 9x9 com borda, label bold, descrição fg-tertiary
   - Chat mockup animado:
     - Barra de título com ícone MessageSquare + "Hexxon AI" + dot verde
     - Mensagem do usuário (bolha azul à direita): "Preciso tirar 8 na P1 de Cálculo. Faltam 18 dias."
     - Typing indicator (3 dots animados)
     - Resposta da IA linha por linha (aparecem com delay de 350ms cada):
       - "Missão criada → P1 Cálculo · meta 8.0" (destaque em accent-primary)
       - "Plano de 18 dias montado" (com ✓ verde)
       - "12 exercícios gerados nos seus gaps" (com ✓)
       - "15 flashcards dos conceitos críticos" (com ✓)
       - "2 simulados agendados (dia 12 e 16)" (com ✓)
       - "Briefing diário começa amanhã, 7h." (sem ✓)
     - Animação ativa por useInView (once: true)
     - IMPORTANTE: guardar current line em variável ANTES de incrementar i no setTimeout

5. SEÇÃO FEATURES (id="recursos")
   - Label: "RECURSOS"
   - Título: "Cada feature resolve um problema real."
   - Grid sm:2 lg:3 com 6 cards:
     1. Brain — "Repetição espaçada" — tag "FSRS" — "Algoritmo FSRS calcula quando cada tópico vai começar a ser esquecido. Você revisa no ponto exato — nem antes, nem depois."
     2. Target — "Missões de estudo" — tag "Auto" — "'Quero 8 em Cálculo.' Um comando. O sistema monta cronograma, exercícios, flashcards e simulados automaticamente."
     3. Network — "Grafo de conhecimento" — tag "Visual" — "Mapa visual de pré-requisitos. Se você trava em derivadas, ele mostra que o problema real está em limites."
     4. Swords — "Simulados calibrados" — tag "Adaptivo" — "Provas cronometradas que focam nos seus pontos fracos. Correção por IA com explicação de cada erro."
     5. Bell — "Alertas inteligentes" — tag "Proativo" — "Detecta padrões de erro repetido, flashcards vencidos, diminishing returns. Avisa antes de virar problema."
     6. BookOpen — "Setup automático" — tag "Zero config" — "Envie planos de ensino e slides. O Hexxon monta disciplinas, tópicos e o grafo inteiro do semestre em minutos."
   - Cada card: padding 6, bg-bg-primary, border-border-default, hover muda borda para border-focus/30
   - Tag no canto superior direito: text-[10px], uppercase, tracking-wider, bg-bg-secondary
   - Ícone muda de fg-secondary para accent-primary no hover do card (transition-colors via group)

6. SEÇÃO FLUXO (id="fluxo")
   - Label: "FLUXO"
   - Título: "Do zero ao domínio em 4 passos."
   - max-w-3xl
   - Timeline vertical simples: linha w-px bg-border-default à esquerda
   - 4 passos com círculo numerado (font-mono, accent-primary):
     01. "Envie seus materiais" — "Planos de ensino, slides, listas de exercício. Qualquer PDF ou documento."
     02. "O sistema estrutura tudo" — "Disciplinas, tópicos, pré-requisitos, grafo de conhecimento — gerado em minutos."
     03. "Estude com o Hexxon" — "Flashcards, exercícios, notas, simulados. Tudo conectado e adaptado ao seu nível."
     04. "Evolua com dados" — "Mastery por tópico, gaps identificados, briefings diários. Você sempre sabe onde está."
   - Sem alternância esquerda/direita — tudo alinhado à esquerda (mais limpo)

7. SEÇÃO PRÉVIA DO APP (id="previa")
   - Label: "PRÉVIA"
   - Título: "Uma interface que trabalha com você."
   - Subtítulo: "Cada tela conecta ao Hexxon AI. Qualquer ação que você faria manualmente, ele pode fazer por você."
   - Mockup do dashboard estilizado:
     - Barra de janela (3 dots cinza + URL "app.hexxon.com/dashboard" em font-mono)
     - Sidebar com 7 itens (ícones: LayoutDashboard, BookOpen, FileText, Swords, BarChart3, Calendar, Network) — Dashboard ativo em accent-primary
     - Área principal com:
       - Saudação: "Bom dia, Otávio" + "3 flashcards vencem hoje · P1 de Cálculo em 12 dias"
       - 3 stat cards: Missões ativas (4), Mastery geral (68%), Sequência (12 dias)
       - 3 barras de progresso com cores distintas:
         - Cálculo I: 62%, cor #06b6d4
         - Fundamentos de Programação: 78%, cor #10b981
         - Física I: 45%, cor #1d4ed8
       - Barras animam de 0 até o valor quando a seção entra em view (useInView + useState + transition CSS duration-1000)

8. CTA FINAL
   - Ícone GraduationCap centralizado
   - "Você vai continuar estudando no escuro?"
   - "Sem cartão de crédito. Setup em 2 minutos. Seus primeiros flashcards saem em 5."
   - 2 botões: "Criar conta grátis" (gradiente) + "Ver prévia do app" (outline, scroll para #previa)

9. FOOTER
   - Logo pequeno + "hexxon · 2026" à esquerda
   - "Learning OS com inteligência artificial" à direita
   - border-t, minimalista

PADRÃO DE ANIMAÇÃO:
- Criar UM componente FadeIn reutilizável:
  - Props: children, delay (default 0)
  - Usa motion.div com initial={{ opacity: 0, y: 16 }}, whileInView={{ opacity: 1, y: 0 }}
  - viewport={{ once: true, margin: "-60px" }}
  - transition com bezier: ease: [0.25, 0.46, 0.45, 0.94], duration: 0.5
- Envolver cada bloco de conteúdo em FadeIn
- Para listas (capabilities, features, steps), usar delay={i * 0.06} ou similar
- NÃO usar whileHover com scale em botões
- NÃO usar glow/pulse em CTAs

O QUE NÃO FAZER:
- Não usar localStorage/sessionStorage
- Não usar canvas/WebGL — tudo com framer-motion + CSS
- Não criar arquivos separados
- Não usar imagens externas
- Não quebrar os links /registro e /login
- Não fazer animações pesadas em mobile
- Não usar clichês: "Revolucione", "Desbloqueie seu potencial", "Poderoso e intuitivo"
- Não colocar glow pulsante em botões
- Não usar hexágonos sólidos com gradiente — usar wireframe (border only)
- Não fazer o nome "HEXXON" em caps gigante com gradiente animado no hero

Gere o código completo do page.tsx agora. Arquivo único, compilável, sem erros de TypeScript.
```

### FIM DO PROMPT

---

## 6. Depois de colar o código

Verifique a tipagem:

```bash
cd study-app
npx tsc --noEmit --skipLibCheck --project tsconfig.json
```

Rode o dev server:

```bash
npm run dev
```

Acesse `http://localhost:3000` (a rota `/` redireciona para a landing page em `(auth)/page.tsx`).

---

## 7. Pontos de atenção para debugging

Se der erro `Cannot read properties of undefined (reading 'includes')` no chat mockup:
- O problema é a closure no setTimeout. A variável `i` é incrementada ANTES do próximo setTimeout ler `allLines[i-1]`.
- Solução: guardar `const current = allLines[i]` ANTES de incrementar.

Se a animação do chat não disparar:
- Conferir que o `useInView` tem `{ once: true, margin: "-100px" }`.
- O ref deve estar no container do chat, não na section inteira.

---

## 8. Estrutura resumida dos componentes

```
LandingPage (export default)
├── ScrollProgress        — barra 2px fixa no topo
├── Header                — sticky, blur, nav + auth links
├── Hero                  — titulo + CTAs + parallax + hexágonos
├── SectionAI             — capabilities + chat mockup animado
├── SectionFeatures       — 6 cards em grid
├── SectionFlow           — timeline vertical, 4 passos
├── SectionPreview        — mockup do dashboard
├── SectionCTA            — call to action final
├── Footer                — minimalista
└── FadeIn (utility)      — wrapper de animação reutilizável
```
