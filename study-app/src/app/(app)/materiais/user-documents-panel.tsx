"use client";

import { useState, useRef } from "react";

interface UserDoc {
  id: string;
  file_name: string;
  doc_type: string;
  processing_status: string;
  file_size: number;
  word_count: number | null;
  page_count: number | null;
  uploaded_at: string;
  ai_analysis: { summary?: string; doc_type?: string } | null;
  discipline_id: string | null;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  syllabus: "Plano de Ensino",
  exercise_list: "Lista de Exercicios",
  slides: "Slides",
  textbook: "Livro-texto",
  past_exam: "Prova Anterior",
  lecture_notes: "Notas de Aula",
  solution_key: "Gabarito",
  other: "Documento",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "text-fg-muted" },
  extracting: { label: "Extraindo texto...", color: "text-accent-primary" },
  analyzing: { label: "Analisando com IA...", color: "text-accent-primary" },
  indexed: { label: "Indexado", color: "text-accent-success" },
  failed: { label: "Falhou", color: "text-accent-error" },
};

export function UserDocumentsPanel({
  documents: initialDocs,
  disciplines,
}: {
  documents: UserDoc[];
  disciplines: Array<{ id: string; name: string }>;
}) {
  const [documents, setDocuments] = useState(initialDocs);
  const [uploading, setUploading] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "materiais_page");
      if (selectedDiscipline) {
        formData.append("disciplineId", selectedDiscipline);
      }

      try {
        const uploadRes = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const { document } = await uploadRes.json();

          // Add to local state
          setDocuments((prev) => [
            {
              id: document.id,
              file_name: document.file_name || file.name,
              doc_type: "other",
              processing_status: "pending",
              file_size: file.size,
              word_count: null,
              page_count: null,
              uploaded_at: new Date().toISOString(),
              ai_analysis: null,
              discipline_id: selectedDiscipline || null,
            },
            ...prev,
          ]);

          // Phase 1: Fast extraction (no AI)
          fetch("/api/documents/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId: document.id, analyze: false }),
          })
            .then(async (res) => {
              if (res.ok) {
                const result = await res.json();
                setDocuments((prev) =>
                  prev.map((d) =>
                    d.id === document.id
                      ? {
                          ...d,
                          processing_status: "indexed",
                          word_count: result.wordCount,
                          page_count: result.pageCount,
                        }
                      : d
                  )
                );

                // Phase 2: AI analysis in background
                fetch("/api/documents/process", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ documentId: document.id, analyze: true }),
                })
                  .then(async (r) => {
                    if (r.ok) {
                      const analysisResult = await r.json();
                      if (analysisResult.analysis) {
                        setDocuments((prev) =>
                          prev.map((d) =>
                            d.id === document.id
                              ? {
                                  ...d,
                                  doc_type: analysisResult.analysis.doc_type || "other",
                                  ai_analysis: analysisResult.analysis,
                                }
                              : d
                          )
                        );
                      }
                    }
                  })
                  .catch(() => console.warn('Background document analysis failed'));
              }
            })
            .catch(() => {
              setDocuments((prev) =>
                prev.map((d) =>
                  d.id === document.id
                    ? { ...d, processing_status: "failed" }
                    : d
                )
              );
            });
        }
      } catch (e) {
        console.error("Upload error:", e);
      }
    }

    setUploading(false);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg-primary">
            Meus Documentos
          </h2>
          <p className="text-sm text-fg-tertiary">
            Documentos enviados e processados pela Hexxon AI. Adicione mais a
            qualquer momento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="rounded-lg border border-border-default bg-bg-surface px-3 py-2 text-xs text-fg-primary"
          >
            <option value="">Todas disciplinas</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50"
          >
            {uploading ? "Enviando..." : "+ Enviar documento"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border-default bg-bg-surface p-8 text-center">
          <p className="text-sm text-fg-muted">
            Nenhum documento enviado ainda. Envie planos de ensino, listas,
            slides ou provas anteriores para a Hexxon AI processar.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {documents.map((doc) => {
            const status = STATUS_LABELS[doc.processing_status] || STATUS_LABELS.pending;
            const discName = disciplines.find(
              (d) => d.id === doc.discipline_id
            )?.name;

            return (
              <div
                key={doc.id}
                className="rounded-2xl border border-border-default bg-bg-surface p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg-primary">
                      {doc.file_name}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-xs text-fg-muted">
                        {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                      </span>
                      {discName && (
                        <span className="rounded-full bg-accent-primary/10 px-2 py-0.5 text-xs text-accent-primary">
                          {discName}
                        </span>
                      )}
                      <span className={`text-xs ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-fg-muted shrink-0">
                    {doc.page_count && <p>{doc.page_count} pags.</p>}
                    <p>{formatSize(doc.file_size)}</p>
                  </div>
                </div>

                {doc.ai_analysis?.summary && (
                  <p className="text-xs text-fg-secondary leading-relaxed">
                    {doc.ai_analysis.summary}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
