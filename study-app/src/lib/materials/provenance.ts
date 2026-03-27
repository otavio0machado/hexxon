import type { MaterialDocument } from "@/lib/materials/types";

export function getMaterialTags(document: MaterialDocument): string[] {
  return [
    document.source === "custom" ? "material-personalizado" : "fonte-oficial",
    `material:${document.id}`,
    `tipo:${document.type}`,
  ];
}

export function prependMaterialHeader(content: string, document: MaterialDocument): string {
  return [
    `Fonte do material: ${document.filename}`,
    `Documento: ${document.id}`,
    `Origem: ${document.source === "custom" ? "adicionado manualmente na plataforma" : "catálogo oficial"}`,
    `Tipo: ${document.type}`,
    "",
    content,
  ].join("\n");
}
