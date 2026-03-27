"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingBootstrapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Claim any legacy data (rows with user_id = NULL) for this user
      await fetch("/api/admin/claim-legacy-data", { method: "POST" });

      await supabase
        .from("user_profiles")
        .update({
          onboarding_completed: true,
          onboarding_step: "completed",
        })
        .eq("id", user.id);
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <div className="text-6xl">🚀</div>
        <h1 className="text-2xl font-bold text-fg-primary">Tudo pronto!</h1>
        <p className="text-sm text-fg-secondary leading-relaxed max-w-md mx-auto">
          O Jarvis está configurado e pronto para te ajudar.
          Você pode adicionar mais materiais a qualquer momento na seção de Materiais.
        </p>
      </div>

      <div className="space-y-3 text-left max-w-md mx-auto">
        <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-surface p-4">
          <span className="text-accent-success">✓</span>
          <span className="text-sm text-fg-primary">Perfil acadêmico configurado</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-surface p-4">
          <span className="text-accent-success">✓</span>
          <span className="text-sm text-fg-primary">Jarvis 3.0 ativado</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-surface p-4">
          <span className="text-accent-success">✓</span>
          <span className="text-sm text-fg-primary">Sistema de repetição espaçada (FSRS) pronto</span>
        </div>
      </div>

      <button
        onClick={handleFinish}
        disabled={loading}
        className="rounded-xl bg-accent-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Ir para o Dashboard"}
      </button>
    </div>
  );
}
