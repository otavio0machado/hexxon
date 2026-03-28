import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center space-y-8">
      <h1 className="text-3xl font-bold text-fg-primary">HEXXON</h1>

      <p className="text-8xl font-bold text-fg-muted">404</p>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-fg-primary">
          Página não encontrada
        </h2>
        <p className="text-sm text-fg-secondary">
          A página que você procura não existe ou foi movida.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-accent-primary px-6 text-sm font-medium text-white hover:bg-accent-primary/90 transition-colors"
      >
        Ir para o Dashboard
      </Link>
    </div>
  )
}
