"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getGraphWithMastery, filterGraph, getWeaknesses, getGraphStats, getPrerequisites, getDependents } from "@/lib/services/knowledge-graph";
import { getDisciplines } from "@/lib/services/disciplines";
import type { GraphWithMastery } from "@/lib/services/knowledge-graph";
import type { Discipline } from "@/lib/supabase";
import { cn, masteryColor, masteryTextColor } from "@/lib/utils";
import { AlertCircle, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

type SideView = "filters" | "detail" | "weaknesses";

export default function MapaPage() {
  const [graph, setGraph] = useState<GraphWithMastery | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [filters, setFilters] = useState({ discipline: "all", kind: "all", mastery: "all", search: "" });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sideView, setSideView] = useState<SideView>("filters");
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Load graph data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [g, d] = await Promise.all([getGraphWithMastery(), getDisciplines()]);
        setGraph(g);
        setDisciplines(d);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar grafo");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter graph
  const filteredGraph = useMemo(() => {
    if (!graph) return null;
    return filterGraph(graph, filters);
  }, [graph, filters]);

  // Get stats and weaknesses
  const stats = useMemo(() => {
    if (!graph) return { totalNodes: 0, concepts: 0, formulas: 0, theorems: 0, totalEdges: 0, masteredCount: 0, avgMastery: 0 };
    return getGraphStats(graph);
  }, [graph]);

  const weaknesses = useMemo(() => {
    if (!graph) return [];
    return getWeaknesses(graph);
  }, [graph]);

  const selectedNode = useMemo(() => {
    if (!graph || !selectedNodeId) return null;
    return graph.nodes.find(n => n.id === selectedNodeId) || null;
  }, [graph, selectedNodeId]);

  const prerequisites = useMemo(() => {
    if (!graph || !selectedNode) return [];
    return getPrerequisites(selectedNode.id, graph);
  }, [graph, selectedNode]);

  const dependents = useMemo(() => {
    if (!graph || !selectedNode) return [];
    return getDependents(selectedNode.id, graph);
  }, [graph, selectedNode]);

  // SVG rendering
  const svgNodes = useMemo(() => {
    if (!filteredGraph) return [];
    return filteredGraph.nodes.map(node => ({
      ...node,
      isSelected: node.id === selectedNodeId,
      isHovered: node.id === hoveredId,
      isWeak: weaknesses.some(w => w.id === node.id),
    }));
  }, [filteredGraph, selectedNodeId, hoveredId, weaknesses]);

  const nodeRadius = { concept: 8, formula: 10, theorem: 9 };
  const nodeShape = { concept: "circle", formula: "diamond", theorem: "triangle" };

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Mapa de Conhecimento</h1>
        <div className="rounded-md border border-accent-danger/30 bg-accent-danger/5 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-accent-danger mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-accent-danger">Erro ao carregar</p>
            <p className="text-xs text-fg-secondary mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">Mapa de Conhecimento</h1>
          <p className="text-xs text-fg-tertiary">
            {stats.totalNodes} nós · {stats.concepts} conceitos · {stats.formulas} fórmulas · {stats.theorems} teoremas · {Math.round(stats.avgMastery * 100)}% dominado
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["filters", "weaknesses"] as const).map((view) => (
            <button
              key={view}
              onClick={() => setSideView(view)}
              className={`rounded-sm border px-2 py-0.5 text-xs transition-colors ${
                sideView === view
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                  : "border-border-default text-fg-tertiary hover:text-fg-secondary"
              }`}
            >
              {view === "filters" ? "Filtros" : "Fraquezas"}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* Graph SVG */}
        {loading ? (
          <div className="flex-1 rounded-md border border-border-default bg-bg-surface flex items-center justify-center">
            <p className="text-sm text-fg-tertiary">Carregando grafo...</p>
          </div>
        ) : filteredGraph ? (
          <div className="flex-1 rounded-md border border-border-default bg-bg-surface overflow-hidden">
            <svg
              width="100%"
              height="100%"
              className="cursor-move bg-bg-surface"
              style={{
                backgroundImage: "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.03) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
              onWheel={(e) => {
                e.preventDefault();
                setScale(s => Math.max(0.5, Math.min(3, s + (e.deltaY > 0 ? -0.1 : 0.1))));
              }}
              onMouseMove={(e) => {
                if (e.buttons === 4 || (e.buttons === 1 && e.ctrlKey)) {
                  setPan(p => ({
                    x: p.x + e.movementX,
                    y: p.y + e.movementY,
                  }));
                }
              }}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
                {/* Edges */}
                {filteredGraph.edges.map((edge) => {
                  const source = filteredGraph.nodes.find(n => n.id === edge.source_id);
                  const target = filteredGraph.nodes.find(n => n.id === edge.target_id);
                  if (!source || !target) return null;
                  return (
                    <line
                      key={edge.id}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="#404046"
                      strokeWidth="1"
                      opacity="0.4"
                    />
                  );
                })}

                {/* Nodes */}
                {svgNodes.map((node) => {
                  const r = nodeRadius[node.kind as keyof typeof nodeRadius] || 8;
                  const shape = nodeShape[node.kind as keyof typeof nodeShape] || "circle";
                  const fill = masteryColor(node.mastery).replace("bg-", "");
                  const fillMap: Record<string, string> = {
                    "mastery-none": "#404046",
                    "mastery-exposed": "#f59e0b",
                    "mastery-developing": "#3b82f6",
                    "mastery-proficient": "#10b981",
                    "mastery-mastered": "#8b5cf6",
                  };

                  return (
                    <g key={node.id} opacity={node.isWeak ? 1 : 0.8}>
                      {shape === "circle" && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={r}
                          fill={fillMap[fill] || "#404046"}
                          stroke={node.isSelected ? "#fafafa" : node.isWeak ? "#ef4444" : "none"}
                          strokeWidth={node.isSelected ? 2 : node.isWeak ? 1.5 : 0}
                          onClick={() => {
                            setSelectedNodeId(node.id);
                            setSideView("detail");
                          }}
                          onMouseEnter={() => setHoveredId(node.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className="cursor-pointer transition-opacity hover:opacity-100"
                          style={{ pointerEvents: "auto" }}
                        />
                      )}
                      {shape === "diamond" && (
                        <polygon
                          points={`${node.x},${node.y - r} ${node.x + r},${node.y} ${node.x},${node.y + r} ${node.x - r},${node.y}`}
                          fill={fillMap[fill] || "#404046"}
                          stroke={node.isSelected ? "#fafafa" : node.isWeak ? "#ef4444" : "none"}
                          strokeWidth={node.isSelected ? 2 : node.isWeak ? 1.5 : 0}
                          onClick={() => {
                            setSelectedNodeId(node.id);
                            setSideView("detail");
                          }}
                          onMouseEnter={() => setHoveredId(node.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className="cursor-pointer transition-opacity hover:opacity-100"
                          style={{ pointerEvents: "auto" }}
                        />
                      )}
                      {shape === "triangle" && (
                        <polygon
                          points={`${node.x},${node.y - r} ${node.x + r},${node.y + r} ${node.x - r},${node.y + r}`}
                          fill={fillMap[fill] || "#404046"}
                          stroke={node.isSelected ? "#fafafa" : node.isWeak ? "#ef4444" : "none"}
                          strokeWidth={node.isSelected ? 2 : node.isWeak ? 1.5 : 0}
                          onClick={() => {
                            setSelectedNodeId(node.id);
                            setSideView("detail");
                          }}
                          onMouseEnter={() => setHoveredId(node.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className="cursor-pointer transition-opacity hover:opacity-100"
                          style={{ pointerEvents: "auto" }}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        ) : null}

        {/* Side panel */}
        <div className="w-80 shrink-0 overflow-y-auto border border-border-default rounded-md bg-bg-surface">
          {sideView === "detail" && selectedNode ? (
            <div className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-fg-primary">{selectedNode.label}</h3>
                  <p className="text-xs text-fg-tertiary mt-1 capitalize">{selectedNode.kind}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedNodeId(null);
                    setSideView("filters");
                  }}
                  className="text-fg-tertiary hover:text-fg-secondary"
                >
                  ✕
                </button>
              </div>

              {selectedNode.description && (
                <div className="text-sm text-fg-secondary">{selectedNode.description}</div>
              )}

              {selectedNode.latex && (
                <div className="bg-bg-primary rounded px-3 py-2 font-mono text-xs text-fg-secondary overflow-x-auto">
                  {selectedNode.latex}
                </div>
              )}

              <div className="border-t border-border-default pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-fg-muted uppercase">Mastery</p>
                  <div className={cn("text-xs font-semibold px-2 py-1 rounded", masteryTextColor(selectedNode.mastery))}>
                    {selectedNode.mastery} • {selectedNode.score.toFixed(2)}
                  </div>
                </div>
              </div>

              {prerequisites.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-fg-muted uppercase">Pré-requisitos</p>
                  {prerequisites.map(p => (
                    <div key={p.id} className="text-xs bg-bg-primary rounded p-2 cursor-pointer hover:bg-bg-secondary transition-colors" onClick={() => setSelectedNodeId(p.id)}>
                      <p className="text-fg-primary font-medium">{p.label}</p>
                      <p className="text-fg-tertiary mt-0.5 capitalize">{p.kind}</p>
                    </div>
                  ))}
                </div>
              )}

              {dependents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-fg-muted uppercase">Dependentes</p>
                  {dependents.map(d => (
                    <div key={d.id} className="text-xs bg-bg-primary rounded p-2 cursor-pointer hover:bg-bg-secondary transition-colors" onClick={() => setSelectedNodeId(d.id)}>
                      <p className="text-fg-primary font-medium">{d.label}</p>
                      <p className="text-fg-tertiary mt-0.5 capitalize">{d.kind}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : sideView === "weaknesses" ? (
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-fg-primary mb-3">Fraquezas ({weaknesses.length})</h3>
              {weaknesses.slice(0, 20).map(w => (
                <div
                  key={w.id}
                  className="text-xs bg-bg-primary rounded p-2 cursor-pointer hover:bg-bg-secondary transition-colors border border-accent-danger/30"
                  onClick={() => {
                    setSelectedNodeId(w.id);
                    setSideView("detail");
                  }}
                >
                  <p className="text-accent-danger font-medium">{w.label}</p>
                  <p className="text-fg-tertiary mt-0.5 capitalize">{w.kind}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-fg-primary mb-3">Filtros</h3>

              <div>
                <label className="text-xs font-medium text-fg-secondary block mb-1">Disciplina</label>
                <select
                  value={filters.discipline}
                  onChange={(e) => setFilters({ ...filters, discipline: e.target.value })}
                  className="w-full rounded border border-border-default bg-bg-primary px-2 py-1 text-xs text-fg-primary"
                >
                  <option value="all">Todas</option>
                  {disciplines.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-fg-secondary block mb-1">Tipo</label>
                <select
                  value={filters.kind}
                  onChange={(e) => setFilters({ ...filters, kind: e.target.value })}
                  className="w-full rounded border border-border-default bg-bg-primary px-2 py-1 text-xs text-fg-primary"
                >
                  <option value="all">Todos</option>
                  <option value="concept">Conceito</option>
                  <option value="formula">Fórmula</option>
                  <option value="theorem">Teorema</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-fg-secondary block mb-1">Mastery</label>
                <select
                  value={filters.mastery}
                  onChange={(e) => setFilters({ ...filters, mastery: e.target.value })}
                  className="w-full rounded border border-border-default bg-bg-primary px-2 py-1 text-xs text-fg-primary"
                >
                  <option value="all">Todos</option>
                  <option value="none">None</option>
                  <option value="exposed">Exposed</option>
                  <option value="developing">Developing</option>
                  <option value="proficient">Proficient</option>
                  <option value="mastered">Mastered</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-fg-secondary block mb-1">Buscar</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Digite para buscar..."
                  className="w-full rounded border border-border-default bg-bg-primary px-2 py-1 text-xs text-fg-primary"
                />
              </div>

              <p className="text-xs text-fg-tertiary pt-2">
                Mostrando {filteredGraph?.nodes.length ?? 0} de {stats.totalNodes} nós
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
