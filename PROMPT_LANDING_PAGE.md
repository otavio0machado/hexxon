# Prompt — Landing Page Animada do Hexxon

> Cole este prompt inteiro no Claude para gerar a landing page.

---

## PROMPT

Você é um desenvolvedor frontend sênior especializado em landing pages de alto impacto. Preciso que você recrie completamente a landing page do **Hexxon**, um Learning OS com IA integrada. A página atual é estática e sem vida — preciso de algo que impressione, com animações, scroll interativo e presença visual forte.

### Stack e Restrições

- **Framework:** Next.js 16 App Router + TypeScript
- **Estilo:** Tailwind CSS (dark theme — fundo escuro, acentos em roxo/violeta)
- **Animações:** Framer Motion (`framer-motion`)
- **Ícones:** Lucide React (`lucide-react`)
- **Arquivo:** `src/app/(auth)/page.tsx` — componente único, sem arquivos separados de CSS
- **Sem dependências extras** além das listadas acima (nada de Three.js, GSAP, etc.)
- **Tokens de cor do projeto:** use variáveis CSS existentes (`text-fg-primary`, `text-fg-secondary`, `text-fg-muted`, `bg-bg-primary`, `bg-bg-secondary`, `bg-bg-surface`, `border-border-default`, `bg-accent-primary`). Se precisar de cores extras para gradientes ou glows, use classes Tailwind padrão com roxo/violeta (`purple-500`, `violet-600`, etc.)

### Estrutura da Página (scroll de cima para baixo)

#### 1. Header Fixo (sticky top)
- Logo "HEXXON" à esquerda
- Navegação central com links âncora para as seções da página
- **Uma aba/botão "Prévia do App"** que, ao clicar, abre um modal ou seção com screenshots/mockup do dashboard do app (pode ser um placeholder visual bonito — um retângulo estilizado com elementos que pareçam um dashboard)
- Botões "Entrar" e "Começar grátis" à direita
- O header deve ter `backdrop-blur` e ficar semi-transparente, aparecendo suavemente ao scrollar

#### 2. Hero Section
- Título grande "HEXXON" com efeito de gradiente animado no texto (roxo → violeta → azul, transicionando suavemente)
- Subtítulo: "Seu copiloto de estudo com inteligência artificial"
- Descrição curta e impactante
- CTAs: "Começar grátis" (botão primário com glow/pulse sutil) e "Ver como funciona" (scroll suave para seção de features)
- **Elemento visual animado:** partículas ou formas geométricas flutuando suavemente no fundo (feitas com divs + Framer Motion, NÃO canvas). Devem se mover lentamente, com parallax ao scroll
- Animação de entrada: todos os elementos do hero entram com fade-in + slide-up escalonado (stagger)

#### 3. Seção "Conheça o Hexxon AI" — Apresentação da IA
- Esta é a seção mais importante. Deve apresentar o **Hexxon** como uma entidade inteligente, não apenas uma feature.
- Layout: à esquerda, texto explicativo. À direita, uma **simulação visual de conversa** com o Hexxon (um chat mockup animado onde mensagens aparecem uma a uma com typing indicator)
- A conversa simulada deve mostrar um cenário real:
  ```
  Usuário: "Preciso tirar 8 na P1 de Cálculo"

  Hexxon: "Missão criada: P1 Cálculo → nota 8.0
  ✓ Plano de 18 dias salvo
  ✓ 12 exercícios gerados (focados nos seus gaps)
  ✓ 15 flashcards dos conceitos críticos
  ✓ 2 simulados agendados

  Amanhã começo o briefing diário. Vamos tirar esse 8."
  ```
- As mensagens devem aparecer quando o usuário scrolla até essa seção (usar `whileInView` do Framer Motion)
- Pontos-chave do Hexxon AI (aparecem com stagger animation):
  - **Omnipresente** — presente em toda página, sabe o que você está fazendo
  - **Proativo** — não espera você perguntar, interrompe quando importa
  - **Executor** — não só responde: cria flashcards, exercícios, planos, registra sessões
  - **35+ ferramentas** — conectado a todo o sistema

#### 4. Seção de Features — Grid Animado
- Título: "Tudo que você precisa para dominar o semestre"
- **6 cards** que aparecem com scroll (staggered, cada um entra com fade + scale):

  1. **Repetição Espaçada (FSRS)**
     - Ícone: Brain
     - "Motor FSRS calcula a curva de esquecimento de cada tópico e agenda revisões no momento ideal."

  2. **Missões de Estudo**
     - Ícone: Target
     - "Um comando e o Hexxon monta plano completo: flashcards, exercícios, cronograma e simulados."

  3. **Grafo de Conhecimento**
     - Ícone: Network (ou GitBranch)
     - "Mapa visual dos pré-requisitos entre tópicos. Identifica bloqueadores antes que virem problema."

  4. **Simulados Inteligentes**
     - Ícone: Swords (ou Trophy)
     - "Provas simuladas cronometradas, calibradas pela dificuldade dos seus pontos fracos, com correção por IA."

  5. **Consciência Situacional**
     - Ícone: Bell (ou AlertTriangle)
     - "Alertas inteligentes: padrões de erro, diminishing returns, prazos de prova, flashcards vencidos."

  6. **Multi-disciplina Automática**
     - Ícone: FileStack (ou BookOpen)
     - "Envie planos de ensino, slides e listas — o Hexxon monta toda a estrutura do semestre automaticamente."

- Cada card deve ter um **hover effect**: borda que brilha com gradiente, leve scale-up, e sombra colorida
- Os cards devem ter um ícone animado (rotação sutil ou pulse no hover)

#### 5. Seção "Como Funciona" — Timeline Vertical Animada
- Uma timeline vertical que se "desenha" conforme o scroll (uma linha que cresce para baixo)
- 4 passos:
  1. **Envie seus documentos** — "Planos de ensino, slides, listas de exercício — o Hexxon lê tudo"
  2. **O sistema se monta sozinho** — "Disciplinas, tópicos, grafo de conhecimento — tudo gerado automaticamente"
  3. **Estude com o Hexxon** — "Flashcards, exercícios, notas, simulados — tudo conectado e adaptativo"
  4. **Evolua com dados** — "Acompanhe mastery, identifique gaps, receba briefings diários"
- Cada passo aparece com fade-in lateral (alternando esquerda/direita) conforme o scroll chega nele

#### 6. Seção "Prévia do App" (a mesma que o header referencia)
- Um mockup visual grande do dashboard do app
- Pode ser um `div` estilizado que simula a interface: sidebar escura à esquerda com ícones, área principal com cards de métricas, um mini grafo decorativo
- Este mockup deve ter um efeito de **perspectiva 3D leve** (rotateX/rotateY com Framer Motion) que responde ao scroll ou ao mouse hover
- Elementos internos do mockup podem ter animações sutis (números contando, barras de progresso preenchendo)

#### 7. Seção Social Proof / Frase de Impacto
- Uma frase grande centralizada com aspas:
  > "Não é sobre ter mais funcionalidades. É sobre ter uma inteligência que te conhece melhor do que você mesmo."
- A frase deve fazer fade-in palavra por palavra (ou linha por linha) conforme entra em view
- Abaixo: "Hexxon — Learning OS" em texto menor

#### 8. CTA Final
- Seção com fundo em gradiente sutil (roxo escuro)
- Texto: "Pronto para transformar como você estuda?"
- Botão grande "Começar grátis" com animação de glow pulsante
- Texto menor: "Sem cartão de crédito. Setup em 2 minutos."

#### 9. Footer
- Minimalista: "Hexxon — Learning OS · 2026"
- Links discretos se necessário

### Requisitos de Animação (IMPORTANTES)

1. **Scroll-triggered animations:** Use `whileInView` do Framer Motion em TODAS as seções. Nada deve estar visível antes do scroll chegar — cada seção "aparece" ao entrar no viewport.
2. **Parallax nos elementos de fundo:** Partículas/formas decorativas se movem em velocidade diferente do conteúdo (use `useScroll` + `useTransform` do Framer Motion).
3. **Stagger nos grupos:** Quando múltiplos elementos aparecem juntos (cards, features, steps), use `staggerChildren` para que entrem um após o outro, não todos de uma vez.
4. **Transições suaves:** Duração entre 0.5s e 0.8s, easing `easeOut`. Nada abrupto.
5. **Elementos flutuantes:** Pelo menos 3-5 formas geométricas (círculos, hexágonos — hexágonos combinam com "Hexxon") que flutuam suavemente pelo fundo da página inteira, com `animate` em loop (y, rotate, opacity).
6. **Scroll progress indicator:** Uma barra fina no topo da página (fixada) que mostra o progresso do scroll com cor accent.
7. **Smooth scroll:** Todo link âncora deve fazer scroll suave até a seção.

### Requisitos Visuais

- **Dark theme consistente.** Fundo principal escuro, cards com bordas sutis, texto em tons claros.
- **Gradientes roxo/violeta** como accent — não exagerar, usar com propósito (títulos, glows, bordas hover, CTAs).
- **Tipografia clara:** títulos grandes e bold, corpo em tamanho legível, hierarquia visual forte.
- **Espaçamento generoso** entre seções — cada seção deve respirar. Mínimo `py-24` por seção.
- **Responsivo:** mobile-first. No mobile, o chat mockup vai abaixo do texto, os cards ficam em coluna única, o mockup do app fica simplificado.

### O que NÃO fazer

- Não usar `localStorage` ou `sessionStorage`
- Não usar canvas ou WebGL — todas as animações com Framer Motion + CSS
- Não criar arquivos separados — tudo em um único `page.tsx`
- Não usar imagens externas — tudo feito com CSS/SVG/divs estilizadas
- Não esquecer de manter os links `/registro` e `/login` funcionando
- Não fazer animações pesadas demais que travem em mobile — manter performático

### Resultado Esperado

Uma landing page que:
1. Causa "wow effect" ao abrir — com o hero animado e elementos flutuantes
2. Conta uma história conforme o scroll — cada seção revela algo novo
3. Apresenta o Hexxon AI como o diferencial central, não apenas uma feature
4. Mostra TODAS as funcionalidades de forma visual e interativa
5. Tem uma prévia visual do app acessível pelo header
6. Termina com um CTA forte que converte
7. Funciona bem em desktop e mobile
8. É um arquivo único que compila sem erros no Next.js 16

Gere o código completo do `page.tsx`.
