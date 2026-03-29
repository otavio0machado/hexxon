import { handleAIRoute } from "@/lib/ai/api-helpers";
import { generateMindmap, type GenerateMindmapInput } from "@/lib/ai/services/generate-mindmap";

function clampHeight(value: number) {
  return Math.min(3000, Math.max(700, Math.round(value)));
}

function validate(body: unknown): GenerateMindmapInput | null {
  const b = body as Record<string, unknown>;
  if (!b.request) return null;

  const noteContent = typeof b.noteContent === "string" ? b.noteContent : "";
  const customContent = b.customContent ? String(b.customContent) : undefined;

  return {
    request: String(b.request),
    noteContent,
    customContent,
    courseName: b.courseName ? String(b.courseName) : undefined,
    topicName: b.topicName ? String(b.topicName) : undefined,
  };
}

export async function POST(request: Request) {
  return handleAIRoute(request, validate, async (input) => {
    const result = await generateMindmap(input);
    return {
      ...result,
      data: {
        ...result.data,
        frame: "canvas" as const,
        height: clampHeight(result.data.height),
      },
    };
  });
}
