"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function OnboardingIntroPage() {
  const router = useRouter();

  async function handleContinue() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_profiles")
        .update({ onboarding_step: "academico" })
        .eq("id", user.id);
    }
    router.push("/onboarding/academico");
  }

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <div className="text-6xl">🤖</div>
        <h1 className="text-3xl font-bold text-fg-primary">
          Eu sou a Hexxon AI.
        </h1>
        <p className="text-lg text-fg-secondary leading-relaxed max-w-lg mx-auto">
          Vou ser seu copiloto de estudo. Conheço técnicas de repetição espaçada,
          monto planos de estudo personalizados e acompanho cada detalhe do seu
          progresso em tempo real.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-left">
        <div className="rounded-xl border border-border-default bg-bg-surface p-4 space-y-2">
          <p className="text-sm font-semibold text-fg-primary">Personalizado</p>
          <p className="text-xs text-fg-secondary">
            Analiso seus documentos e monto um sistema sob medida para o seu semestre.
          </p>
        </div>
        <div className="rounded-xl border border-border-default bg-bg-surface p-4 space-y-2">
          <p className="text-sm font-semibold text-fg-primary">Proativo</p>
          <p className="text-xs text-fg-secondary">
            Detecto gaps, alerto sobre provas próximas e sugiro o que estudar agora.
          </p>
        </div>
        <div className="rounded-xl border border-border-default bg-bg-surface p-4 space-y-2">
          <p className="text-sm font-semibold text-fg-primary">Inteligente</p>
          <p className="text-xs text-fg-secondary">
            35+ ferramentas para criar flashcards, exercícios, simulados e muito mais.
          </p>
        </div>
      </div>

      <Button onClick={handleContinue} size="lg" className="rounded-xl px-8">
        Vamos começar
      </Button>
    </div>
  );
}
