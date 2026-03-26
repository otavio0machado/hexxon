"use client";

import { useState, useMemo, useCallback } from "react";
import { GraphRenderer } from "@/components/knowledge-graph/graph-renderer";
import { NodeDetail } from "@/components/knowledge-graph/node-detail";
import { GraphFilters } from "@/components/knowledge-graph/graph-filters";
import { GraphLegend } from "@/components/knowledge-graph/graph-legend";
import { WeaknessPanel } from "@/components/knowledge-graph/weakness-panel";
import {
  filterGraph,
  getWeaknesses,
  getGraphStats,
  getModuleGroups,
  getNode,
  defaultFilter,
  type GraphFilter,
} from "@/lib/knowledge-graph";
import { getNodes } from "@/lib/knowledge-graph";
import type { KGNode } from "@/data/knowledge-graph";

type SideView = "filters" | "detail" | "weaknesses";

export default function MapaPage() {
  const [filter, setFilter] = useState<GraphFilter>(defaultFilter);
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sideView, setSideView] = useState<SideView>("filters");

  const { nodes: filteredNodes, edges: filteredEdges } = useMemo(
    () => filterGraph(filter),
    [filter]
  );

  const weaknesses = useMemo(() => getWeaknesses(), []);
  const stats = useMemo(() => getGraphStats(), []);
  const modules = useMemo(() => {
    const allModules = getModuleGroups();
    const visibleIds = new Set(filteredNodes.map((n) => n.id));
    return allModules.filter((m) => m.nodes.some((n) => visibleIds.has(n.id)));
  }, [filteredNodes]);

  const selectedWeakness = selectedNode
    ? weaknesses.find((w) => w.node.id === selectedNode.id)
    : undefined;

  const handleSelect = useCallback((node: KGNode) => {
    setSelectedNode(node);
    setSideView("detail");
  }, []);

  const handleNavigate = useCallback((nodeId: string) => {
    const node = getNode(nodeId);
    if (node) {
      setSelectedNode(node);
      setSideView("detail");
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null);
    setSideView("filters");
  }, []);

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">
            Mapa de Conhecimento
          </h1>
          <p className="text-xs text-fg-tertiary">
            {stats.totalNodes} nós · {stats.totalEdges} arestas · {stats.weaknessCount} fraqueza(s)
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
        {/* Graph */}
        <div className="flex-1">
          <GraphRenderer
            nodes={filteredNodes}
            edges={filteredEdges}
            modules={modules}
            weaknesses={weaknesses}
            selectedId={selectedNode?.id}
            hoveredId={hoveredId ?? undefined}
            onSelect={handleSelect}
            onHover={setHoveredId}
          />
        </div>

        {/* Side panel */}
        <div className="w-72 shrink-0 overflow-y-auto">
          {sideView === "detail" && selectedNode ? (
            <div className="rounded-md border border-border-default bg-bg-surface">
              <NodeDetail
                node={selectedNode}
                weakness={selectedWeakness}
                onClose={handleCloseDetail}
                onNavigate={handleNavigate}
              />
            </div>
          ) : sideView === "weaknesses" ? (
            <WeaknessPanel
              weaknesses={weaknesses}
              onNavigate={handleNavigate}
            />
          ) : (
            <div className="rounded-md border border-border-default bg-bg-surface p-3">
              <GraphFilters
                filter={filter}
                onChange={setFilter}
                stats={{
                  total: stats.totalNodes,
                  visible: filteredNodes.length,
                  weaknesses: stats.weaknessCount,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <GraphLegend />
    </div>
  );
}
