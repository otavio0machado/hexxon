"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email ou senha incorretos."
        : error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
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
        <p className="text-sm text-fg-secondary">Entre na sua conta</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="••••••••"
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
          Entrar
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
        onClick={handleGoogleLogin}
        className="w-full rounded-xl py-3"
      >
        Continuar com Google
      </Button>

      <p className="text-center text-sm text-fg-muted">
        Não tem conta?{" "}
        <Link href="/registro" className="text-accent-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
