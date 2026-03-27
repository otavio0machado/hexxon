"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface Option {
  id: string;
  name: string;
}

const typeOptions = [
  { value: "material_aula", label: "Material de aula" },
  { value: "lista_exercicios", label: "Lista de exercícios" },
  { value: "exemplos_resolvidos", label: "Exemplos resolvidos" },
  { value: "plano_ensino", label: "Plano de ensino" },
  { value: "livro_texto", label: "Livro-base" },
] as const;

const relevanceOptions = [
  { value: "critical", label: "Crítica" },
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
] as const;

export function MaterialUploadPanel({
  disciplineOptions,
  topicOptionsByDiscipline,
}: {
  disciplineOptions: Option[];
  topicOptionsByDiscipline: Record<string, Option[]>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [disciplineId, setDisciplineId] = useState(disciplineOptions[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [usage, setUsage] = useState("");
  const [type, setType] = useState<(typeof typeOptions)[number]["value"]>("material_aula");
  const [relevance, setRelevance] = useState<(typeof relevanceOptions)[number]["value"]>("high");
  const [pageCount, setPageCount] = useState("");
  const [hasExercises, setHasExercises] = useState(false);
  const [hasSolutions, setHasSolutions] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdDocument, setCreatedDocument] = useState<{ id: string; filename: string } | null>(null);

  useEffect(() => {
    const availableTopics = topicOptionsByDiscipline[disciplineId] ?? [];
    setSelectedTopicIds((currentTopicIds) =>
      currentTopicIds.filter((topicId) =>
        availableTopics.some((topic) => topic.id === topicId),
      ),
    );
  }, [disciplineId, topicOptionsByDiscipline]);

  const availableTopics = topicOptionsByDiscipline[disciplineId] ?? [];

  function toggleTopic(topicId: string) {
    setSelectedTopicIds((currentTopicIds) =>
      currentTopicIds.includes(topicId)
        ? currentTopicIds.filter((entry) => entry !== topicId)
        : [...currentTopicIds, topicId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Selecione um PDF para enviar.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setCreatedDocument(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("disciplineId", disciplineId);
      formData.append("description", description);
      formData.append("usage", usage);
      formData.append("type", type);
      formData.append("relevance", relevance);
      formData.append("pageCount", pageCount);
      formData.append("hasExercises", String(hasExercises));
      formData.append("hasSolutions", String(hasSolutions));
      selectedTopicIds.forEach((topicId) => formData.append("topicIds", topicId));

      const response = await fetch("/api/materials/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível adicionar o material.");
      }

      setCreatedDocument(data.document);
      setDescription("");
      setUsage("");
      setType("material_aula");
      setRelevance("high");
      setPageCount("");
      setHasExercises(false);
      setHasSolutions(false);
      setSelectedTopicIds([]);
      setFile(null);
      setFileInputKey((currentKey) => currentKey + 1);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro desconhecido ao adicionar o material.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border-default bg-bg-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-fg-primary">Adicionar material direto daqui</h2>
          <p className="text-sm text-fg-tertiary">
            Envie um PDF, descreva o contexto e ele entra no catálogo da aba de materiais.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-xl border border-border-default bg-bg-primary px-4 py-2 text-sm font-medium text-fg-primary transition-colors hover:border-accent-primary hover:bg-bg-tertiary"
        >
          {open ? "Fechar formulário" : "Novo material"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Arquivo PDF">
              <input
                key={fileInputKey}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setCreatedDocument(null);
                }}
                className="w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-fg-primary outline-none file:mr-3 file:rounded-md file:border-0 file:bg-accent-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-bg-primary"
              />
            </Field>

            <Field label="Disciplina">
              <select
                value={disciplineId}
                onChange={(event) => setDisciplineId(event.target.value)}
                className="w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-fg-primary outline-none"
              >
                {disciplineOptions.map((discipline) => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tipo">
              <select
                value={type}
                onChange={(event) => setType(event.target.value as typeof type)}
                className="w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-fg-primary outline-none"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Relevância">
              <select
                value={relevance}
                onChange={(event) => setRelevance(event.target.value as typeof relevance)}
                className="w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-fg-primary outline-none"
              >
                {relevanceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Descrição">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Resumo curto do que o PDF cobre e por que ele importa."
                rows={4}
                required
                className="w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-fg-primary outline-none"
              />
            </Field>

            <Field label="Uso no produto">
              <textarea
                value={usage}
                onChange={(event) => setUsage(event.target.value)}
                placeholder="Ex.: usar como base de revisão, exercícios extras ou referência teórica."
                rows={4}
                className="w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-fg-primary outline-none"
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
            <Field label="Tópicos relacionados">
              <div className="max-h-52 overflow-auto rounded-xl border border-border-default bg-bg-secondary p-3">
                {availableTopics.length === 0 ? (
                  <p className="text-sm text-fg-muted">Nenhum tópico disponível para esta disciplina.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableTopics.map((topic) => (
                      <label
                        key={topic.id}
                        className="flex items-start gap-2 rounded-lg border border-transparent px-2 py-1 text-sm text-fg-secondary transition-colors hover:border-border-default hover:bg-bg-primary"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTopicIds.includes(topic.id)}
                          onChange={() => toggleTopic(topic.id)}
                          className="mt-1"
                        />
                        <span>{topic.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-fg-muted">
                Se nenhum tópico for marcado, o material entra como referência geral da disciplina.
              </p>
            </Field>

            <div className="space-y-4">
              <Field label="Número de páginas">
                <input
                  type="number"
                  min={1}
                  value={pageCount}
                  onChange={(event) => setPageCount(event.target.value)}
                  placeholder="Opcional"
                  className="w-full rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm text-fg-primary outline-none"
                />
              </Field>

              <div className="rounded-xl border border-border-default bg-bg-secondary p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-fg-muted">
                  Sinais do material
                </p>
                <div className="mt-3 space-y-3">
                  <label className="flex items-center gap-2 text-sm text-fg-secondary">
                    <input
                      type="checkbox"
                      checked={hasExercises}
                      onChange={(event) => setHasExercises(event.target.checked)}
                    />
                    <span>Contém exercícios</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-fg-secondary">
                    <input
                      type="checkbox"
                      checked={hasSolutions}
                      onChange={(event) => setHasSolutions(event.target.checked)}
                    />
                    <span>Contém resolução/gabarito</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-fg-muted">
              O PDF fica disponível na plataforma e aparece junto dos demais materiais da disciplina.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-accent-primary px-4 py-3 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Enviando material..." : "Adicionar material"}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-accent-danger/30 bg-accent-danger/5 px-4 py-3 text-sm text-accent-danger">
              {error}
            </div>
          )}

          {createdDocument && (
            <div className="rounded-xl border border-accent-success/30 bg-accent-success/5 px-4 py-3 text-sm text-accent-success">
              Material adicionado com sucesso:{" "}
              <Link href={`/materiais/${createdDocument.id}`} className="font-medium underline">
                {createdDocument.filename}
              </Link>
            </div>
          )}
        </form>
      )}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wider text-fg-muted">{label}</span>
      {children}
    </label>
  );
}
