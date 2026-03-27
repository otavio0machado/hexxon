import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Hero */}
      <header className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="space-y-6 max-w-2xl">
          <h1 className="text-5xl font-bold tracking-tight text-fg-primary sm:text-6xl">
            cogni<span className="text-accent-primary">.</span>
          </h1>
          <p className="text-xl text-fg-secondary leading-relaxed">
            Seu copiloto de estudo com inteligência artificial.
            Planos personalizados, repetição espaçada e um assistente que
            conhece cada detalhe do seu semestre.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/registro"
              className="rounded-xl bg-accent-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-primary/90"
            >
              Começar grátis
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-border-default px-8 py-3 text-sm font-semibold text-fg-secondary transition-colors hover:bg-bg-secondary"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="border-t border-border-default bg-bg-secondary px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Jarvis 3.0"
            description="Assistente com 35+ ferramentas, streaming em tempo real e consciência situacional do seu progresso."
          />
          <FeatureCard
            title="Repetição Espaçada"
            description="Motor FSRS que calcula a curva de esquecimento de cada tópico e agenda revisões no momento ideal."
          />
          <FeatureCard
            title="Missões de Estudo"
            description="Um comando e o Jarvis monta plano, flashcards, exercícios e cronograma para sua prova."
          />
          <FeatureCard
            title="Grafo de Conhecimento"
            description="Mapa visual dos pré-requisitos entre tópicos. Identifica bloqueadores antes que virem problema."
          />
          <FeatureCard
            title="Simulados Inteligentes"
            description="Provas simuladas compostas pelos tópicos mais fracos, com correção detalhada por IA."
          />
          <FeatureCard
            title="Multi-disciplina"
            description="Gerado automaticamente a partir dos seus documentos: planos de ensino, livros, slides e listas."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-default px-6 py-6 text-center text-xs text-fg-muted">
        cogni. — Sistema cognitivo de estudo pessoal
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border-default bg-bg-surface p-6 space-y-2">
      <h3 className="text-base font-semibold text-fg-primary">{title}</h3>
      <p className="text-sm leading-relaxed text-fg-secondary">{description}</p>
    </div>
  );
}
