"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingDocumentosPage() {
  const router = useRouter();

  async function handleContinue() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_profiles")
        .update({ onboarding_step: "bootstrap" })
        .eq("id", user.id);
    }
    router.push("/onboarding/bootstrap");
  }

  async function handleSkip() {
    // Allow skipping document upload for now
    await handleContinue();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-primary">
          Passo 3 de 4
        </p>
        <h1 className="text-2xl font-bold text-fg-primary">Envie seus materiais</h1>
        <p className="text-sm text-fg-secondary leading-relaxed">
          Quanto mais material você enviar, melhor o Jarvis vai te ajudar.
          Planos de ensino, listas de exercícios, slides, livros — tudo conta.
        </p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-border-default bg-bg-surface p-12 text-center space-y-4">
        <div className="text-4xl">📄</div>
        <p className="text-sm text-fg-secondary">
          Arraste PDFs aqui ou clique para selecionar
        </p>
        <p className="text-xs text-fg-muted">
          Planos de ensino, ementas, listas, slides, livros, provas anteriores
        </p>
        <p className="text-xs text-fg-muted italic">
          Upload completo será implementado em breve.
          Por enquanto, você pode adicionar materiais depois em /materiais.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSkip}
          className="flex-1 rounded-xl border border-border-default py-3 text-sm font-medium text-fg-secondary transition-colors hover:bg-bg-secondary"
        >
          Pular por agora
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 rounded-xl bg-accent-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
