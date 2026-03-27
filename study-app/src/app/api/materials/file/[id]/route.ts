import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getMaterialFileAsset } from "@/lib/materials/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const asset = await getMaterialFileAsset(id);

  if (!asset) {
    return NextResponse.json({ error: "Arquivo do material não encontrado." }, { status: 404 });
  }

  const fileBuffer = await fs.readFile(asset.filePath);
  const { searchParams } = new URL(request.url);
  const asDownload = searchParams.get("download") === "1";

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${asDownload ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(asset.document.filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
