# Prompt — Implementar Tema Claro (Light Mode) no Hexxon

## Contexto

O Hexxon é uma plataforma de estudo com IA. Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 (com `@theme inline`) + Geist Font. Atualmente é **dark-only**. Preciso que você implemente um **tema claro (light mode)** com toggle, preservando o dark mode como default.

O sistema de cores é baseado em **CSS custom properties (design tokens)** definidos em `src/app/globals.css` dentro de `:root`. Os tokens são expostos ao Tailwind via bloco `@theme inline`. A maioria dos componentes já usa classes semânticas como `bg-bg-primary`, `text-fg-primary`, `border-border-default` — o que facilita muito a implementação.

A identidade visual da marca é um gradiente **deep blue (#1d4ed8) → cyan/teal (#06b6d4) → green (#10b981)**. O accent principal é `#06b6d4` (cyan).

Total de arquivos TS/TSX: ~117. A grande maioria já usa os tokens semânticos.

---

## Arquivos-chave

- **`src/app/globals.css`** — Todos os design tokens vivem aqui em `:root`. É onde você deve criar o bloco de override para light mode.
- **`src/app/layout.tsx`** — Root layout. Atualmente tem `className="... dark"` hardcoded no `<html>`. Precisa virar dinâmico.
- **`src/app/(app)/layout.tsx`** — Layout do app autenticado (sidebar + HexxonAiProvider).
- **`src/components/layout/sidebar.tsx`** — Sidebar principal. Onde o toggle de tema deve ficar.

---

## Tarefas

### 1. Criar paleta light em `globals.css`

Mantenha o `:root` atual (dark) como está. Adicione um seletor `html.light` que sobrescreva todas as custom properties:

```css
/* Light theme override */
html.light {
  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-surface: #ffffff;

  /* Foreground */
  --fg-primary: #0f172a;
  --fg-secondary: #475569;
  --fg-tertiary: #64748b;
  --fg-muted: #cbd5e1;

  /* Borders */
  --border-default: #e2e8f0;
  --border-subtle: #f1f5f9;
  --border-focus: #0891b2;

  /* Mastery — mesmas cores, mas none precisa ser visível em fundo branco */
  --mastery-none: #cbd5e1;
  --mastery-exposed: #ca8a04;
  --mastery-developing: #ea580c;
  --mastery-proficient: #0891b2;
  --mastery-mastered: #059669;

  /* Accents — ligeiramente mais saturados para legibilidade em branco */
  --accent-primary: #0891b2;
  --accent-danger: #dc2626;
  --accent-warning: #d97706;
  --accent-success: #059669;
  --accent-info: #0284c7;

  /* Brand gradient — versão levemente mais profunda para fundo claro */
  --brand-gradient: linear-gradient(135deg, #2563eb, #0891b2, #059669);

  /* Shadows — mais suaves */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-dropdown: 0 4px 12px rgba(0, 0, 0, 0.08);
}
```

Atualize também os estilos de scrollbar, selection e KaTeX para light mode:

```css
html.light ::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}
html.light ::-webkit-scrollbar-thumb {
  background: #cbd5e1;
}
html.light ::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

html.light ::selection {
  background: rgba(8, 145, 178, 0.2);
}

html.light .hexxon-ai-prose .katex-display {
  background: var(--bg-secondary);
  border-color: var(--border-default);
}
```

### 2. Criar `src/components/theme-provider.tsx`

Crie um context provider simples (sem next-themes — zero dependências extras):

```tsx
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('hexxon-theme') as Theme | null
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
      document.documentElement.classList.toggle('light', saved === 'light')
      document.documentElement.classList.toggle('dark', saved !== 'light')
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('hexxon-theme', next)
      document.documentElement.classList.toggle('light', next === 'light')
      document.documentElement.classList.toggle('dark', next !== 'light')
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

### 3. Atualizar `src/app/layout.tsx`

- Importe `ThemeProvider` e envolva `{children}` com ele
- Mantenha `dark` como classe default do `<html>` (o provider troca via useEffect)
- Adicione `suppressHydrationWarning` no `<html>`
- Adicione um script inline no `<head>` para evitar flash de tema errado (FOIWT):

```tsx
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('hexxon-theme');
              if (t === 'light') {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="bg-bg-primary text-fg-primary">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 4. Adicionar botão de toggle na sidebar

No `src/components/layout/sidebar.tsx`, adicione um botão sol/lua na parte inferior:

```tsx
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

// Dentro do componente, na seção inferior da sidebar:
const { theme, toggleTheme } = useTheme()

<button
  onClick={toggleTheme}
  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-fg-tertiary transition-colors hover:bg-bg-secondary hover:text-fg-secondary"
  title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
>
  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
  {!collapsed && (
    <span className="flex-1 text-left text-sm">
      {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
    </span>
  )}
</button>
```

### 5. Corrigir hardcoded colors que quebram no light mode

Estes são os pontos problemáticos identificados:

#### A) `text-white` em botões (14 arquivos)

O `text-white` em botões com `bg-accent-primary` é **aceitável** — texto branco sobre fundo colorido funciona em ambos os temas. Mas verifique caso a caso nestes arquivos:

- `src/app/(auth)/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/registro/page.tsx`
- `src/app/(app)/materiais/user-documents-panel.tsx`
- `src/app/(app)/notas/page.tsx`
- `src/app/onboarding/intro/page.tsx`
- `src/app/onboarding/bootstrap/page.tsx`
- `src/app/onboarding/academico/page.tsx`
- `src/app/onboarding/documentos/page.tsx`
- `src/components/notes/notes-workspace.tsx`
- `src/components/notes/graph-generator-modal.tsx`
- `src/components/notes/ai-action-modal.tsx`
- `src/components/notes/interactive-generator-modal.tsx`
- `src/components/hexxon-ai/chat.tsx`

#### B) Gradientes hardcoded com baixa opacidade (2 arquivos — CRÍTICO)

Estes usam classes como `from-blue-600/20 via-cyan-500/20 to-emerald-500/20` que ficam quase invisíveis em fundo branco:

- `src/app/(app)/hexxon-ai/page.tsx`
- `src/components/hexxon-ai/chat.tsx`

Classes afetadas nestes arquivos:
- `text-cyan-400` → Muito claro em fundo branco. Usar `text-cyan-600` no light ou trocar por `text-accent-primary`.
- `ring-cyan-500/20`, `bg-cyan-500/15`, `border-cyan-500/25` → Quase invisíveis em branco. Aumentar opacidade ou trocar por tokens.
- `bg-gradient-to-br from-blue-600/20 via-cyan-500/20 to-emerald-500/20` → Trocar por `from-blue-600/10 via-cyan-500/10 to-emerald-500/10` no light (ou usar tokens).
- `bg-blue-500/20 text-blue-400` → Trocar `text-blue-400` por `text-blue-600` no light.

**Estratégia recomendada:** Como esses componentes têm muitas cores Tailwind hardcoded, a melhor abordagem é criar CSS tokens adicionais para esses valores (como `--chat-gradient-from`, `--chat-accent`, etc.) e sobrescrevê-los em `html.light`.

#### C) Hardcoded hex/rgba em componentes de notas (3 arquivos — ALTO)

- `src/components/notes/interactive-artifact-preview.tsx` — tem `bg-[#111216]`, `border-white/10`, `bg-black`
- `src/components/notes/interactive-note-block.tsx` — tem `shadow-[0_18px_50px_rgba(0,0,0,0.18)]`
- `src/components/notes/renderable-note-block.tsx` — pode ter shadows similares

Para estes: trocar `bg-[#111216]` por `bg-bg-secondary`, `border-white/10` por `border-border-subtle`, `bg-black` por `bg-bg-primary`. Shadows com `rgba(0,0,0,0.18)` devem ser reduzidos para `rgba(0,0,0,0.06)` no light ou usar os tokens de shadow.

---

## Referência — Tokens dark atuais

```css
:root {
  --bg-primary: #09090b;
  --bg-secondary: #111318;
  --bg-tertiary: #1a1d24;
  --bg-surface: #14161c;
  --fg-primary: #f0f4f8;
  --fg-secondary: #94a3b8;
  --fg-tertiary: #64748b;
  --fg-muted: #334155;
  --border-default: #1e293b;
  --border-subtle: #172033;
  --border-focus: #06b6d4;
  --accent-primary: #06b6d4;
  --accent-danger: #ef4444;
  --accent-warning: #f59e0b;
  --accent-success: #10b981;
  --accent-info: #38bdf8;
  --brand-gradient: linear-gradient(135deg, #1d4ed8, #06b6d4, #10b981);
}
```

O bloco `@theme inline` expõe esses tokens ao Tailwind como `--color-bg-primary`, `--color-fg-primary`, etc. Classes como `bg-bg-primary` e `text-fg-primary` funcionam automaticamente — basta sobrescrever os tokens em `html.light`.

---

## Regras

1. **NÃO renomear** variáveis, funções, imports, nomes de arquivos ou pastas. Só mexer em estilos e criar o provider.
2. **Dark mode é o default.** Se `localStorage` estiver vazio, use dark.
3. **Zero dependências novas.** Não instale `next-themes` ou similar.
4. **Manter a identidade visual da marca.** O gradiente e a cor cyan devem ser reconhecíveis em ambos os temas.
5. **Contraste WCAG AA** mínimo em ambos os temas (4.5:1 para texto, 3:1 para ícones).
6. Rodar `npm run build` ao final para garantir que compila sem erros.
