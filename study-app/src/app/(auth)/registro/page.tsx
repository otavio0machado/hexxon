"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegistroPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Create user profile
    if (data.user) {
      await supabase.from("user_profiles").insert({
        id: data.user.id,
        full_name: fullName,
        university: "",
        course: "",
        total_semesters: 0,
        current_semester: 0,
        onboarding_completed: false,
        onboarding_step: "intro",
      });
    }

    router.push("/onboarding/intro");
    router.refresh();
  }

  async function handleGoogleSignUp() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="w-full max-w-sm space-y-8 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-fg-primary">
          cogni<span className="text-accent-primary">.</span>
        </h1>
        <p className="text-sm text-fg-secondary">Crie sua conta</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-fg-secondary" htmlFor="name">Nome completo</label>
          <input
            id="name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-xl border border-border-default bg-bg-surface px-4 py-3 text-sm text-fg-primary placeholder-fg-muted focus:border-accent-primary focus:outline-none"
            placeholder="Seu nome"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-fg-secondary" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-border-default bg-bg-surface px-4 py-3 text-sm text-fg-primary placeholder-fg-muted focus:border-accent-primary focus:outline-none"
            placeholder="seu@email.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-fg-secondary" htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-border-default bg-bg-surface px-4 py-3 text-sm text-fg-primary placeholder-fg-muted focus:border-accent-primary focus:outline-none"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {error && (
          <p className="text-sm text-accent-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90 disabled:opacity-50"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-default" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-bg-primary px-2 text-fg-muted">ou</span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignUp}
        className="w-full rounded-xl border border-border-default py-3 text-sm font-medium text-fg-secondary transition-colors hover:bg-bg-secondary"
      >
        Continuar com Google
      </button>

      <p className="text-center text-sm text-fg-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-accent-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
