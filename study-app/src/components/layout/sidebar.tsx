"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  Calendar,
  Files,
  StickyNote,
  Network,
  GraduationCap,
  Stethoscope,
  PanelLeftClose,
  PanelLeft,
  Search,
  Keyboard,
  Bot,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { getCurriculumDisciplines } from "@/lib/materials/catalog";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

// ── Mobile sidebar context ──────────────────────────────────
const MobileSidebarContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileSidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

// ── Nav data ────────────────────────────────────────────────

const disciplineNavItems = getCurriculumDisciplines().map((discipline) => ({
  href: `/disciplina/${discipline.id}`,
  label: discipline.name,
  icon: BookOpen,
  shortcut: "",
}));

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "⌘1" },
  { href: "/materiais", label: "Materiais", icon: Files, shortcut: "⌘2" },
  { href: "/provas", label: "Provas", icon: GraduationCap, shortcut: "⌘4" },
  { href: "/diagnostico", label: "Diagnóstico", icon: Stethoscope, shortcut: "⌘5" },
  { href: "/mapa", label: "Mapa Conceitual", icon: Network, shortcut: "⌘6" },
  { href: "/exercicios", label: "Exercícios", icon: Dumbbell, shortcut: "⌘7" },
  { href: "/calendario", label: "Calendário", icon: Calendar, shortcut: "⌘8" },
  { href: "/notas", label: "Notas", icon: StickyNote, shortcut: "⌘9" },
  { href: "/jarvis", label: "Hexxon AI", icon: Bot, shortcut: "⌘J" },
];

// ── Mobile header bar ───────────────────────────────────────

export function MobileHeader() {
  const { setOpen } = useMobileSidebar();

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-3 border-b border-border-default bg-bg-primary/95 backdrop-blur-sm px-4">
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-fg-tertiary hover:bg-bg-secondary hover:text-fg-primary transition-colors"
      >
        <Menu size={20} />
      </button>
      <span className="text-sm font-semibold tracking-tight text-fg-primary">
        HEXXON
      </span>
    </header>
  );
}

// ── Sidebar ─────────────────────────────────────────────────

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { open: mobileOpen, setOpen: setMobileOpen } = useMobileSidebar();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border-default px-4">
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight text-fg-primary">
            HEXXON
          </span>
        )}
        <button
          onClick={() => {
            if (mobileOpen) setMobileOpen(false);
            else setCollapsed(!collapsed);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-fg-tertiary transition-colors hover:bg-bg-secondary hover:text-fg-secondary"
          title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {mobileOpen ? (
            <X size={16} />
          ) : collapsed ? (
            <PanelLeft size={16} />
          ) : (
            <PanelLeftClose size={16} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {!collapsed && (
          <div className="mb-1 px-2 pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
              Disciplinas
            </span>
          </div>
        )}
        {disciplineNavItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed && !mobileOpen}
            active={pathname === item.href}
          />
        ))}

        {!collapsed && (
          <div className="mb-1 mt-4 px-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted">
              Navegação
            </span>
          </div>
        )}
        {(collapsed && !mobileOpen) && <div className="my-3 border-t border-border-default" />}
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            collapsed={collapsed && !mobileOpen}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      {/* Bottom shortcuts */}
      <div className="border-t border-border-default px-2 py-3">
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-fg-tertiary transition-colors hover:bg-bg-secondary hover:text-fg-secondary">
          <Search size={16} />
          {(!collapsed || mobileOpen) && (
            <>
              <span className="flex-1 text-left text-sm">Buscar</span>
              <kbd className="rounded border border-border-default bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
                ⌘K
              </kbd>
            </>
          )}
        </button>
        {(!collapsed || mobileOpen) && (
          <button className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-fg-tertiary transition-colors hover:bg-bg-secondary hover:text-fg-secondary">
            <Keyboard size={16} />
            <span className="flex-1 text-left text-sm">Atalhos</span>
            <kbd className="rounded border border-border-default bg-bg-tertiary px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">
              ?
            </kbd>
          </button>
        )}
        <button
          onClick={toggleTheme}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-fg-tertiary transition-colors hover:bg-bg-secondary hover:text-fg-secondary"
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {(!collapsed || mobileOpen) && (
            <span className="flex-1 text-left text-sm">
              {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            </span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-border-default bg-bg-primary transition-all",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-border-default bg-bg-primary slide-in-from-right">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  shortcut,
  collapsed,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  shortcut: string;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-bg-secondary text-fg-primary"
          : "text-fg-tertiary hover:bg-bg-secondary hover:text-fg-secondary"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={16} />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {shortcut && (
            <kbd className="hidden rounded border border-border-default bg-bg-tertiary px-1 py-0.5 font-mono text-[10px] text-fg-muted group-hover:inline-block">
              {shortcut}
            </kbd>
          )}
        </>
      )}
    </Link>
  );
}
