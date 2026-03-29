import { callAI } from "../router";
import { parseJSON } from "../anthropic";
import type {
  AIResponse,
  AIServiceConfig,
  GenerateNoteInteractiveOutput,
} from "../types";

const SYSTEM_PROMPT = `Você gera mapas mentais interativos em HTML/CSS/JS puro para notas de estudo.

OBJETIVO:
Criar um mapa mental CLEAN, minimalista e navegável. Priorize legibilidade e espaçamento generoso.

═══ LAYOUT ═══

Use SEMPRE layout em ÁRVORE VERTICAL:
- Nó raiz centralizado no topo.
- Ramos crescem para baixo, nível por nível.
- Cada nível é uma "fila" horizontal de nós, espaçados igualmente.
- Algoritmo de layout:
  1. Calcule a largura de cada sub-árvore (soma das larguras dos filhos + gaps).
  2. Centre cada nó sobre seus filhos.
  3. Gap horizontal entre nós irmãos: mínimo 32px.
  4. Gap vertical entre níveis: 80px.
  5. Padding do container: 40px em todos os lados.
- Isso garante que NENHUM nó se sobreponha a outro.

═══ CONEXÕES ═══

- Use um único elemento <svg> com position:absolute cobrindo todo o mapa.
- Conexões são paths SVG com curva bezier vertical (M x1,y1 C x1,mid x2,mid x2,y2).
- Cor da linha = cor do ramo pai, com opacity 0.5, stroke-width: 2px.
- Recalcule TODAS as conexões após cada expand/collapse usando getBoundingClientRect().
- O SVG deve ter pointer-events:none.

═══ NÓS ═══

- Nó raiz: font-size 16px, font-weight 700, padding 14px 24px, border-radius 16px, background #1e293b, border: 2px solid #475569.
- Nós nível 1 (ramos principais): font-size 13px, font-weight 600, padding 10px 18px, border-radius 12px. Cada ramo tem uma COR DISTINTA do set:
  ["#0f766e","#0369a1","#7c3aed","#c2410c","#b91c1c","#4338ca","#15803d","#a16207"]
  Fundo do nó = cor com 15% opacity. Texto = cor com 100%. Borda = cor com 30%.
- Nós nível 2+: font-size 12px, font-weight 400, padding 8px 14px, border-radius 10px.
  Herdam a cor do ramo pai mas com 10% opacity no fundo.
- TODOS os nós: cursor pointer (se tem filhos), white-space nowrap, max-width 220px, text-overflow ellipsis.
- Hover: box-shadow 0 0 0 2px {cor do ramo} com 25% opacity. Transition 150ms.

═══ EXPAND / COLLAPSE ═══

- Nós com filhos mostram um badge circular pequeno (16x16px) no canto inferior direito: "+" quando colapsado, "−" quando expandido.
  Badge: background = cor do ramo, color = white, font-size 11px, border-radius 50%.
- Iniciar com nível 1 expandido, níveis 2+ colapsados.
- Ao clicar: toggle visibility dos filhos, recalcular posições com transição (transform, transition 300ms ease).
- Filhos colapsados: display none. Ao expandir: display flex, fade in.

═══ ESTILO GLOBAL ═══

- Fundo: transparent (o iframe já tem fundo escuro).
- Font-family: system-ui, -apple-system, sans-serif.
- Container raiz: width 100%, position relative, display flex, flex-direction column, align-items center.
- Overflow: o container pai (iframe) já tem scroll, não adicione overflow:auto interno.
- NÃO adicione texto de instrução como "Clique nos nós" — a interface já é intuitiva.

═══ REGRAS TÉCNICAS ═══

- HTML/CSS/JS 100% inline, autocontido, sem CDN/imports.
- Estruture a árvore como objeto JS: { label, children, color? }
- Renderize dinamicamente: crie elementos DOM a partir da estrutura, posicione com JS.
- NUNCA use parênteses (), colchetes [] ou chaves {} no texto dos nós — quebre em sub-nós se necessário.
- Seja FIEL ao conteúdo fornecido. Não invente conceitos.
- Profundidade máxima: 4 níveis.
- Nós-folha sem filhos: não mostrar badge +/−.
- O height no JSON = altura do mapa com TODOS os nós expandidos + padding.

═══ FORMATO DE RESPOSTA (JSON estrito) ═══
{
  "title": "string",
  "html": "string com HTML completo",
  "explanation": "string curta",
  "frame": "canvas",
  "height": number
}`;

export interface GenerateMindmapInput {
  request: string;
  noteContent: string;
  customContent?: string;
  courseName?: string;
  topicName?: string;
}

export async function generateMindmap(
  input: GenerateMindmapInput,
  config?: AIServiceConfig,
): Promise<AIResponse<GenerateNoteInteractiveOutput>> {
  const courseBlock = input.courseName ? `DISCIPLINA: ${input.courseName}\n` : "";
  const topicBlock = input.topicName ? `TÓPICO: ${input.topicName}\n` : "";

  const content = input.customContent || input.noteContent;

  const userMessage = `${courseBlock}${topicBlock}
PEDIDO DO USUÁRIO:
${input.request}

CONTEÚDO BASE:
${content.slice(0, 10000)}

Gere um mapa mental interativo em HTML/CSS/JS.`;

  return callAI<GenerateNoteInteractiveOutput>(
    {
      service: "generateMindmap",
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 12000,
      temperature: 0.3,
      ...config,
    },
    parseJSON,
  );
}
