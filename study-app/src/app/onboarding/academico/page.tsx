"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          <Input
            value={form.university}
            onChange={(e) => update("university", e.target.value)}
            required
            placeholder="Ex: PUCRS"
            className="rounded-xl px-4 py-3"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-fg-secondary">Curso</label>
          <Input
            value={form.course}
            onChange={(e) => update("course", e.target.value)}
            required
            placeholder="Ex: Ciência da Computação"
            className="rounded-xl px-4 py-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-fg-secondary">Total de semestres</label>
            <Input
              type="number"
              value={form.total_semesters}
              onChange={(e) => update("total_semesters", e.target.value)}
              required
              min={1}
              max={20}
              placeholder="8"
              className="rounded-xl px-4 py-3"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-fg-secondary">Semestre atual</label>
            <Input
              type="number"
              value={form.current_semester}
              onChange={(e) => update("current_semester", e.target.value)}
              required
              min={1}
              max={20}
              placeholder="1"
              className="rounded-xl px-4 py-3"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-fg-secondary">Período de ingresso</label>
          <Input
            value={form.enrollment_year}
            onChange={(e) => update("enrollment_year", e.target.value)}
            placeholder="Ex: 2026/1"
            className="rounded-xl px-4 py-3"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full rounded-xl">
          Continuar
        </Button>
      </form>
    </div>
  );
}
