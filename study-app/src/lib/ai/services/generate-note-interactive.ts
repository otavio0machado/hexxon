import { callAI } from "../router";
import { parseJSON } from "../anthropic";
import type {
  AIResponse,
  AIServiceConfig,
  GenerateNoteInteractiveInput,
  GenerateNoteInteractiveOutput,
} from "../types";

const SYSTEM_PROMPT = `Crie blocos interativos autocontidos em HTML/CSS/JS para notas universitarias.
Responda APENAS com JSON valido, sem texto extra.

REGRAS:
- html: autocontido (HTML+CSS+JS inline), sem CDN/imports/assets externos. Iframe sandboxado, offline.
- Texto legivel, espacamento generoso, contraste alto, fundo escuro (#0a0a0b) com texto claro.
- phone (390px largura) para pedidos mobile. canvas (responsivo) para o resto.
- height: inteiro entre 560 e 920.
- Sem alert/prompt/confirm/navegacao/fetch. JS curto e focado.
- Fiel ao conteudo da nota.

FORMATO:
{"title":"string","html":"string","explanation":"string","frame":"phone|canvas","height":720}`;

export async function generateNoteInteractive(
  input: GenerateNoteInteractiveInput,
  config?: AIServiceConfig,
): Promise<AIResponse<GenerateNoteInteractiveOutput>> {
  const courseBlock = input.courseName ? `DISCIPLINA: ${input.courseName}\n` : "";
  const topicBlock = input.topicName ? `TOPICO: ${input.topicName}\n` : "";
  const frameBlock = `FRAME PREFERIDO: ${input.frameHint ?? "auto"}\n`;

  const userMessage = `${courseBlock}${topicBlock}${frameBlock}
PEDIDO DO USUARIO:
${input.request}

TRECHO DA NOTA:
${input.noteContent.slice(0, 8000)}

Gere um bloco interativo pronto para insercao na nota.`;

  return callAI<GenerateNoteInteractiveOutput>(
    {
      service: "generateNoteInteractive",
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 8192,
      temperature: 0.3,
      ...config,
    },
    parseJSON,
  );
}
