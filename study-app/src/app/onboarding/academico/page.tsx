"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingAcademicoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    university: "",
    course: "",
    total_semesters: "",
    current_semester: "",
    enrollment_year: "",
  });
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_profiles")
        .update({
          university: form.university,
          course: form.course,
          total_semesters: parseInt(form.total_semesters) || 0,
          current_semester: parseInt(form.current_semester) || 0,
          enrollment_year: form.enrollment_year,
          onboarding_step: "documentos",
        })
        .eq("id", user.id);
    }

    router.push("/onboarding/documentos");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-primary">
          Passo 2 de 4
        </p>
        <h1 className="text-2xl font-bold text-fg-primary">Dados acadêmicos</h1>
        <p className="text-sm text-fg-secondary">
          Me conte sobre seu curso para eu personalizar tudo.
        </p>
      </div>

      <form onSubmit={handleContinue} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-fg-secondary">Faculdade / Universidade</label>
          <input
            value={form.university}
            onChange={(e) => update("university", e.target.value)}
            required
            placeholder="Ex: PUCRS"
            className="w-full rounded-xl border border-border-default bg-bg-surface px-4 py-3 text-sm text-fg-primary placeholder-fg-muted focus:border-accent-primary focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-fg-secondary">Curso</label>
          <input
            value={form.course}
            onChange={(e) => update("course", e.target.value)}
            required
            placeholder="Ex: Ciência da Computação"
            className="w-full rounded-xl border border-border-default bg-bg-surface px-4 py-3 text-sm text-fg-primary placeholder-fg-muted focus:border-accent-primary focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-fg-secondary">Total de semestres</label>
            <input
              type="number"
              value={form.total_semesters}
              onChange={(e) => update("total_semesters", e.target.value)}
              required
              min={1}
              max={20}
              placeholder="8"
              className="w-full rounded-xl border border-border-default bg-bg-surface px-4 py-3 text-sm text-fg-primary placeholder-fg-muted focus:border-accent-primary focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-fg-secondary">Semestre atual</label>
            <input
              type="number"
              value={form.current_semester}
              onChange={(e) => update("current_semester", e.target.value)}
              required
              min={1}
              max={20}
              placeholder="1"
              className="w-full rounded-xl border border-border-default bg-bg-surface px-4 py-3 text-sm text-fg-primary placeholder-fg-muted focus:border-accent-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-fg-secondary">Período de ingresso</label>
          <input
            value={form.enrollment_year}
            onChange={(e) => update("enrollment_year", e.target.value)}
            placeholder="Ex: 2026/1"
            className="w-full rounded-xl border border-border-default bg-bg-surface px-4 py-3 text-sm text-fg-primary placeholder-fg-muted focus:border-accent-primary focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Continuar"}
        </button>
      </form>
    </div>
  );
}
