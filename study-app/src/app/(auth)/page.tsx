"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useInView,
  useMotionValueEvent,
} from "framer-motion";
import {
  Brain,
  Target,
  Network,
  Swords,
  Bell,
  BookOpen,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  ArrowUpRight,
  Zap,
  Eye,
  Wrench,
  MessageSquare,
  LayoutDashboard,
  FileText,
  BarChart3,
  Calendar,
  GraduationCap,
} from "lucide-react";

/* ──────────────────────────────────────────────
   SCROLL PROGRESS
   ────────────────────────────────────────────── */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]"
      style={{
        scaleX,
        background: "var(--brand-gradient)",
      }}
    />
  );
}

/* ──────────────────────────────────────────────
   HEADER
   ────────────────────────────────────────────── */

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const navItems = [
    { label: "IA", id: "ia" },
    { label: "Recursos", id: "recursos" },
    { label: "Fluxo", id: "fluxo" },
    { label: "Prévia", id: "previa" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-bg-primary/70 backdrop-blur-xl border-b border-border-default/50"
          : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md" style={{ background: "var(--brand-gradient)" }} />
          <span className="text-fg-primary font-semibold text-lg tracking-tight">hexxon</span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className="px-3 py-1.5 text-sm text-fg-tertiary hover:text-fg-primary transition-colors rounded-md hover:bg-bg-secondary"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-fg-secondary hover:text-fg-primary transition-colors px-3 py-1.5"
          >
            Entrar
          </Link>
          <Link
            href="/registro"
            className="text-sm font-medium text-bg-primary bg-fg-primary px-4 py-2 rounded-lg hover:bg-fg-secondary transition-colors"
          >
            Criar conta
          </Link>
        </div>

        <button className="md:hidden text-fg-primary" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-bg-primary border-b border-border-default px-5 pb-5 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className="block w-full text-left px-3 py-2.5 text-sm text-fg-secondary hover:text-fg-primary rounded-md hover:bg-bg-secondary transition-colors"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-3 border-t border-border-default flex gap-2">
            <Link href="/login" className="flex-1 text-center text-sm py-2.5 text-fg-secondary rounded-lg border border-border-default hover:bg-bg-secondary transition-colors">
              Entrar
            </Link>
            <Link href="/registro" className="flex-1 text-center text-sm font-medium py-2.5 text-bg-primary bg-fg-primary rounded-lg hover:bg-fg-secondary transition-colors">
              Criar conta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ──────────────────────────────────────────────
   HERO
   ────────────────────────────────────────────── */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.8], [0, -80]);

  return (
    <section ref={ref} className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
      {/* ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.07] pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--accent-primary), transparent 70%)" }}
      />

      {/* floating shapes — subtle, no spinning */}
      {[
        { size: 140, x: "12%", y: "18%", delay: 0, dur: 7 },
        { size: 90, x: "82%", y: "25%", delay: 1.5, dur: 9 },
        { size: 60, x: "75%", y: "72%", delay: 0.8, dur: 6 },
        { size: 110, x: "8%", y: "68%", delay: 2, dur: 8 },
      ].map((s, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: s.x, top: s.y,
            width: s.size, height: s.size,
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            border: "1px solid rgba(6,182,212,0.08)",
            background: "rgba(6,182,212,0.02)",
          }}
          animate={{ y: [-12, 12] }}
          transition={{ duration: s.dur, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: s.delay }}
        />
      ))}

      <motion.div className="relative z-10 max-w-3xl mx-auto px-5 text-center" style={{ opacity, y }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-default bg-bg-secondary/50 text-xs text-fg-tertiary mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
            Sistema de estudo com IA integrada
          </div>

          <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-fg-primary mb-5">
            Estude com quem{" "}
            <span className="relative">
              <span
                style={{
                  backgroundImage: "var(--brand-gradient)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                entende
              </span>
            </span>
            <br />
            como você aprende
          </h1>

          <p className="text-fg-secondary text-lg sm:text-xl leading-relaxed max-w-xl mx-auto mb-10">
            O Hexxon monta seu plano de estudo, gera exercícios nos seus pontos fracos e te avisa quando está na hora de revisar. Tudo automático.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Link
            href="/registro"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-lg text-bg-primary transition-all"
            style={{ background: "var(--brand-gradient)" }}
          >
            Começar grátis
            <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <button
            onClick={() => document.getElementById("ia")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base text-fg-secondary border border-border-default rounded-lg hover:bg-bg-secondary hover:text-fg-primary transition-all"
          >
            Como funciona
            <ChevronDown size={16} />
          </button>
        </motion.div>
      </motion.div>

      {/* scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown size={20} className="text-fg-muted" />
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   SECTION: HEXXON AI
   ────────────────────────────────────────────── */

function SectionAI() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(chatRef, { once: true, margin: "-100px" });
  const [lines, setLines] = useState<string[]>([]);

  const userMsg = "Preciso tirar 8 na P1 de Cálculo. Faltam 18 dias.";
  const aiLines = [
    "Missão criada → P1 Cálculo · meta 8.0",
    "Plano de 18 dias montado",
    "12 exercícios gerados nos seus gaps",
    "15 flashcards dos conceitos críticos",
    "2 simulados agendados (dia 12 e 16)",
    "Briefing diário começa amanhã, 7h.",
  ];

  useEffect(() => {
    if (!isInView) return;
    let timeout: NodeJS.Timeout;
    const allLines: string[] = [userMsg, "...", ...aiLines];
    let i = 0;
    const next = () => {
      if (i >= allLines.length) return;
      const current = allLines[i];
      setLines((prev) => [...prev, current]);
      i++;
      timeout = setTimeout(next, current === "..." ? 800 : 350);
    };
    timeout = setTimeout(next, 400);
    return () => clearTimeout(timeout);
  }, [isInView]);

  const capabilities = [
    { icon: Eye, label: "Omnipresente", desc: "Sabe o que você está estudando, em qual página, há quanto tempo." },
    { icon: Zap, label: "Proativo", desc: "Não espera. Se detecta padrão de erro ou fadiga, interrompe." },
    { icon: Wrench, label: "Executor", desc: "Não só responde: cria flashcards, monta provas, registra sessões." },
    { icon: Sparkles, label: "35+ ferramentas", desc: "Conectado a todo o sistema — de repetição espaçada a simulados." },
  ];

  return (
    <section id="ia" className="py-28 px-5">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <p className="text-accent-primary text-sm font-medium tracking-wide uppercase mb-3">Inteligência Artificial</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-fg-primary mb-4 max-w-lg">
            O Hexxon não é um chatbot.<br />É seu copiloto de semestre.
          </h2>
          <p className="text-fg-secondary max-w-lg mb-14">
            Ele entende o contexto do que você está fazendo, age sem precisar pedir, e executa tarefas que normalmente levariam horas.
          </p>
        </FadeIn>

        <div className="grid lg:grid-cols-5 gap-10 items-start">
          {/* capabilities — left */}
          <div className="lg:col-span-2 space-y-6">
            {capabilities.map((cap, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="flex gap-4 group">
                  <div className="mt-0.5 w-9 h-9 rounded-lg bg-bg-secondary border border-border-default flex items-center justify-center flex-shrink-0 group-hover:border-accent-primary/40 transition-colors">
                    <cap.icon size={16} className="text-accent-primary" />
                  </div>
                  <div>
                    <p className="text-fg-primary font-medium text-sm mb-1">{cap.label}</p>
                    <p className="text-fg-tertiary text-sm leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* chat mockup — right */}
          <div ref={chatRef} className="lg:col-span-3">
            <div className="rounded-xl border border-border-default bg-bg-secondary overflow-hidden">
              {/* title bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default bg-bg-primary/50">
                <MessageSquare size={14} className="text-accent-primary" />
                <span className="text-xs text-fg-tertiary font-medium">Hexxon AI</span>
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-success" />
              </div>

              {/* messages */}
              <div className="p-4 space-y-3 min-h-[320px]">
                {lines.filter(Boolean).map((line, i) => {
                  if (i === 0) {
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-end"
                      >
                        <div className="bg-accent-primary/20 border border-accent-primary/20 text-fg-primary text-sm px-4 py-2.5 rounded-2xl rounded-tr-md max-w-[85%]">
                          {line}
                        </div>
                      </motion.div>
                    );
                  }
                  if (line === "...") {
                    return (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1 px-2 py-2">
                        {[0, 1, 2].map((d) => (
                          <motion.div
                            key={d}
                            className="w-1.5 h-1.5 rounded-full bg-fg-muted"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                          />
                        ))}
                      </motion.div>
                    );
                  }
                  const isFirst = i === 2;
                  const hasCheck = line.includes("montado") || line.includes("gerados") || line.includes("flashcards") || line.includes("agendados");
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`text-sm ${isFirst ? "mt-1" : ""}`}
                    >
                      <div className={`inline-flex items-start gap-2 px-4 py-2 rounded-2xl rounded-tl-md ${
                        isFirst
                          ? "bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-medium"
                          : "bg-bg-primary border border-border-default text-fg-primary"
                      }`}>
                        {hasCheck && <span className="text-accent-success mt-px">✓</span>}
                        <span>{line}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   SECTION: FEATURES
   ────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Brain,
    title: "Repetição espaçada",
    desc: "Algoritmo FSRS calcula quando cada tópico vai começar a ser esquecido. Você revisa no ponto exato — nem antes, nem depois.",
    tag: "FSRS",
  },
  {
    icon: Target,
    title: "Missões de estudo",
    desc: "\"Quero 8 em Cálculo.\" Um comando. O sistema monta cronograma, exercícios, flashcards e simulados automaticamente.",
    tag: "Auto",
  },
  {
    icon: Network,
    title: "Grafo de conhecimento",
    desc: "Mapa visual de pré-requisitos. Se você trava em derivadas, ele mostra que o problema real está em limites.",
    tag: "Visual",
  },
  {
    icon: Swords,
    title: "Simulados calibrados",
    desc: "Provas cronometradas que focam nos seus pontos fracos. Correção por IA com explicação de cada erro.",
    tag: "Adaptivo",
  },
  {
    icon: Bell,
    title: "Alertas inteligentes",
    desc: "Detecta padrões de erro repetido, flashcards vencidos, diminishing returns. Avisa antes de virar problema.",
    tag: "Proativo",
  },
  {
    icon: BookOpen,
    title: "Setup automático",
    desc: "Envie planos de ensino e slides. O Hexxon monta disciplinas, tópicos e o grafo inteiro do semestre em minutos.",
    tag: "Zero config",
  },
];

function SectionFeatures() {
  return (
    <section id="recursos" className="py-28 px-5 bg-bg-secondary/50">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <p className="text-accent-primary text-sm font-medium tracking-wide uppercase mb-3">Recursos</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-fg-primary mb-14 max-w-md">
            Cada feature resolve um problema real.
          </h2>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <div className="group p-6 rounded-xl bg-bg-primary border border-border-default hover:border-border-focus/30 transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center">
                    <f.icon size={18} className="text-fg-secondary group-hover:text-accent-primary transition-colors" />
                  </div>
                  <span className="text-[10px] font-medium tracking-wider uppercase text-fg-muted bg-bg-secondary px-2 py-0.5 rounded">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-fg-primary font-semibold mb-2">{f.title}</h3>
                <p className="text-fg-tertiary text-sm leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   SECTION: FLOW (HOW IT WORKS)
   ────────────────────────────────────────────── */

const STEPS = [
  { num: "01", title: "Envie seus materiais", desc: "Planos de ensino, slides, listas de exercício. Qualquer PDF ou documento." },
  { num: "02", title: "O sistema estrutura tudo", desc: "Disciplinas, tópicos, pré-requisitos, grafo de conhecimento — gerado em minutos." },
  { num: "03", title: "Estude com o Hexxon", desc: "Flashcards, exercícios, notas, simulados. Tudo conectado e adaptado ao seu nível." },
  { num: "04", title: "Evolua com dados", desc: "Mastery por tópico, gaps identificados, briefings diários. Você sempre sabe onde está." },
];

function SectionFlow() {
  return (
    <section id="fluxo" className="py-28 px-5">
      <div className="max-w-3xl mx-auto">
        <FadeIn>
          <p className="text-accent-primary text-sm font-medium tracking-wide uppercase mb-3">Fluxo</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-fg-primary mb-14">
            Do zero ao domínio em 4 passos.
          </h2>
        </FadeIn>

        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border-default" />

          <div className="space-y-10">
            {STEPS.map((step, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="flex gap-6 items-start">
                  <div className="relative z-10 w-10 h-10 rounded-full border border-border-default bg-bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-mono text-accent-primary font-medium">{step.num}</span>
                  </div>
                  <div className="pt-1.5">
                    <h3 className="text-fg-primary font-semibold mb-1">{step.title}</h3>
                    <p className="text-fg-tertiary text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   SECTION: APP PREVIEW
   ────────────────────────────────────────────── */

function SectionPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [progress, setProgress] = useState({ calc: 0, prog: 0, fis: 0 });

  useEffect(() => {
    if (!isInView) return;
    const t = setTimeout(() => setProgress({ calc: 62, prog: 78, fis: 45 }), 300);
    return () => clearTimeout(t);
  }, [isInView]);

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: BookOpen, label: "Flashcards" },
    { icon: FileText, label: "Notas" },
    { icon: Swords, label: "Exercícios" },
    { icon: BarChart3, label: "Simulados" },
    { icon: Calendar, label: "Calendário" },
    { icon: Network, label: "Mapa" },
  ];

  return (
    <section id="previa" className="py-28 px-5 bg-bg-secondary/50">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <p className="text-accent-primary text-sm font-medium tracking-wide uppercase mb-3">Prévia</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-fg-primary mb-4 max-w-lg">
            Uma interface que trabalha com você.
          </h2>
          <p className="text-fg-secondary max-w-lg mb-12">
            Cada tela conecta ao Hexxon AI. Qualquer ação que você faria manualmente, ele pode fazer por você.
          </p>
        </FadeIn>

        <FadeIn>
          <div
            ref={ref}
            className="rounded-xl border border-border-default bg-bg-primary overflow-hidden shadow-2xl shadow-black/20"
          >
            {/* title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-default bg-bg-secondary/50">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-fg-muted/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-fg-muted/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-fg-muted/30" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-3 py-0.5 rounded-md bg-bg-tertiary text-[10px] text-fg-muted font-mono">
                  app.hexxon.com/dashboard
                </div>
              </div>
            </div>

            <div className="flex min-h-[380px]">
              {/* sidebar */}
              <div className="hidden sm:block w-48 border-r border-border-default bg-bg-secondary/30 p-3 space-y-0.5">
                <div className="flex items-center gap-2 px-3 py-2 mb-3">
                  <div className="w-5 h-5 rounded" style={{ background: "var(--brand-gradient)" }} />
                  <span className="text-xs font-semibold text-fg-primary">hexxon</span>
                </div>
                {sidebarItems.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs ${
                      item.active
                        ? "bg-accent-primary/10 text-accent-primary font-medium"
                        : "text-fg-tertiary"
                    }`}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* main area */}
              <div className="flex-1 p-5 space-y-4">
                {/* greeting */}
                <div>
                  <p className="text-fg-primary font-semibold text-sm">Bom dia, Otávio</p>
                  <p className="text-fg-tertiary text-xs mt-0.5">3 flashcards vencem hoje · P1 de Cálculo em 12 dias</p>
                </div>

                {/* stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Missões ativas", val: "4" },
                    { label: "Mastery geral", val: "68%" },
                    { label: "Sequência", val: "12 dias" },
                  ].map((s, i) => (
                    <div key={i} className="p-3 rounded-lg bg-bg-secondary border border-border-default">
                      <p className="text-[10px] text-fg-muted uppercase tracking-wider">{s.label}</p>
                      <p className="text-lg font-bold text-fg-primary mt-1">{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* progress bars */}
                <div className="p-4 rounded-lg bg-bg-secondary border border-border-default space-y-3">
                  <p className="text-xs font-medium text-fg-secondary mb-2">Mastery por disciplina</p>
                  {[
                    { name: "Cálculo I", val: progress.calc, color: "var(--accent-primary)" },
                    { name: "Fundamentos de Programação", val: progress.prog, color: "var(--accent-success)" },
                    { name: "Física I", val: progress.fis, color: "var(--accent-info)" },
                  ].map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-fg-secondary">{d.name}</span>
                        <span className="text-fg-tertiary font-mono">{d.val}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${d.val}%`, background: d.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   SECTION: CTA FINAL
   ────────────────────────────────────────────── */

function SectionCTA() {
  return (
    <section className="py-28 px-5">
      <div className="max-w-2xl mx-auto text-center">
        <FadeIn>
          <GraduationCap size={32} className="text-accent-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-fg-primary mb-4">
            Você vai continuar estudando no escuro?
          </h2>
          <p className="text-fg-secondary text-lg mb-10 max-w-md mx-auto">
            Sem cartão de crédito. Setup em 2 minutos. Seus primeiros flashcards saem em 5.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/registro"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-medium rounded-lg text-bg-primary transition-all hover:brightness-110"
              style={{ background: "var(--brand-gradient)" }}
            >
              Criar conta grátis
              <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <button
              onClick={() => document.getElementById("previa")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base text-fg-secondary border border-border-default rounded-lg hover:bg-bg-secondary hover:text-fg-primary transition-all"
            >
              Ver prévia do app
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   FOOTER
   ────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border-default py-8 px-5">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded" style={{ background: "var(--brand-gradient)" }} />
          <span className="text-sm text-fg-tertiary">hexxon · 2026</span>
        </div>
        <p className="text-xs text-fg-muted">Learning OS com inteligência artificial</p>
      </div>
    </footer>
  );
}

/* ──────────────────────────────────────────────
   UTILITY: FADE IN WRAPPER
   ────────────────────────────────────────────── */

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="bg-bg-primary text-fg-primary">
      <ScrollProgress />
      <Header />
      <Hero />
      <SectionAI />
      <SectionFeatures />
      <SectionFlow />
      <SectionPreview />
      <SectionCTA />
      <Footer />
    </div>
  );
}
