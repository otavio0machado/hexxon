"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          HEXXON
        </h1>
        <p className="text-sm text-fg-secondary">Crie sua conta</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-fg-secondary" htmlFor="name">Nome completo</label>
          <Input
            id="name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Seu nome"
            error={!!error}
            className="rounded-xl px-4 py-3"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-fg-secondary" htmlFor="email">Email</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            error={!!error}
            className="rounded-xl px-4 py-3"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-fg-secondary" htmlFor="password">Senha</label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            error={!!error}
            className="rounded-xl px-4 py-3"
          />
        </div>

        {error && (
          <p className="text-sm text-accent-danger">{error}</p>
        )}

        <Button
          type="submit"
          loading={loading}
          className="w-full rounded-xl py-3"
        >
          Criar conta
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border-default" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-bg-primary px-2 text-fg-muted">ou</span>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={handleGoogleSignUp}
        className="w-full rounded-xl py-3"
      >
        Continuar com Google
      </Button>

      <p className="text-center text-sm text-fg-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-accent-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
