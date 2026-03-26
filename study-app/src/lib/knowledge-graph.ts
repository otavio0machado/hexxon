// ============================================================
// KNOWLEDGE GRAPH ENGINE
// Layout helpers, filtering, weakness detection, pathfinding
// ============================================================

import {
  nodes as allNodes,
  edges as allEdges,
  type KGNode,
  type KGEdge,
  type NodeKind,
  type EdgeKind,
  MASTERY_FILL,
  NODE_RADIUS,
} from "@/data/knowledge-graph";
import type { MasteryLevel } from "@/data/mock";

// ── Lookups ──

const nodeMap = new Map<string, KGNode>(allNodes.map((n) => [n.id, n]));

export function getNode(id: string): KGNode | undefined {
  return nodeMap.get(id);
}

export function getNodes(): KGNode[] {
  return allNodes;
}

export function getEdges(): KGEdge[] {
  return allEdges;
}

// ── Filtering ──

export interface GraphFilter {
  discipline: "all" | "calculo-1" | "mat-discreta";
  kinds: NodeKind[];
  edgeKinds: EdgeKind[];
  masteryLevels: MasteryLevel[];
  showWeaknessesOnly: boolean;
  searchQuery: string;
}

export const defaultFilter: GraphFilter = {
  discipline: "all",
  kinds: ["concept", "formula", "theorem"],
  edgeKinds: ["depends_on", "connects", "appears_in_exam"],
  masteryLevels: ["none", "exposed", "developing", "proficient", "mastered"],
  showWeaknessesOnly: false,
  searchQuery: "",
};

export function filterGraph(filter: GraphFilter): { nodes: KGNode[]; edges: KGEdge[] } {
  let filtered = [...allNodes];

  if (filter.discipline !== "all") {
    filtered = filtered.filter((n) => n.disciplineId === filter.discipline || n.moduleId === "cross");
  }

  filtered = filtered.filter((n) => filter.kinds.includes(n.kind));
  filtered = filtered.filter((n) => filter.masteryLevels.includes(n.mastery));

  if (filter.showWeaknessesOnly) {
    const weakIds = new Set(getWeaknesses().map((w) => w.node.id));
    const blockerIds = new Set(getWeaknesses().flatMap((w) => w.blockedNodes.map((b) => b.id)));
    filtered = filtered.filter((n) => weakIds.has(n.id) || blockerIds.has(n.id));
  }

  if (filter.searchQuery.trim()) {
    const q = filter.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.moduleName.toLowerCase().includes(q)
    );
  }

  const ids = new Set(filtered.map((n) => n.id));
  const filteredEdges = allEdges.filter(
    (e) =>
      ids.has(e.source) &&
      ids.has(e.target) &&
      filter.edgeKinds.includes(e.kind)
  );

  return { nodes: filtered, edges: filteredEdges };
}

// ── Adjacency helpers ──

export function getPrerequisites(nodeId: string): KGNode[] {
  return allEdges
    .filter((e) => e.target === nodeId && e.kind === "depends_on")
    .map((e) => nodeMap.get(e.source))
    .filter((n): n is KGNode => !!n);
}

export function getDependents(nodeId: string): KGNode[] {
  return allEdges
    .filter((e) => e.source === nodeId && e.kind === "depends_on")
    .map((e) => nodeMap.get(e.target))
    .filter((n): n is KGNode => !!n);
}

export function getConnected(nodeId: string): { node: KGNode; edge: KGEdge }[] {
  return allEdges
    .filter((e) => e.source === nodeId || e.target === nodeId)
    .map((e) => {
      const otherId = e.source === nodeId ? e.target : e.source;
      const node = nodeMap.get(otherId);
      return node ? { node, edge: e } : null;
    })
    .filter((r): r is { node: KGNode; edge: KGEdge } => !!r);
}

export function getEdgesBetween(nodeId: string): KGEdge[] {
  return allEdges.filter((e) => e.source === nodeId || e.target === nodeId);
}

// ── Weakness detection ──

const MASTERY_SCORE: Record<MasteryLevel, number> = {
  none: 0,
  exposed: 1,
  developing: 2,
  proficient: 3,
  mastered: 4,
};

export interface Weakness {
  node: KGNode;
  reason: string;
  severity: "critical" | "high" | "medium";
  blockedNodes: KGNode[];
}

export function getWeaknesses(): Weakness[] {
  const weaknesses: Weakness[] = [];

  for (const node of allNodes) {
    // Find dependents that have higher-weight edges
    const dependents = allEdges
      .filter((e) => e.source === node.id && e.kind === "depends_on" && e.weight >= 2)
      .map((e) => nodeMap.get(e.target))
      .filter((n): n is KGNode => !!n);

    if (dependents.length === 0) continue;

    const myScore = MASTERY_SCORE[node.mastery];

    if (myScore <= 1) {
      // This node is weak (none/exposed) and blocks important dependents
      const blockedHighWeight = dependents.filter((d) => {
        const edge = allEdges.find(
          (e) => e.source === node.id && e.target === d.id && e.kind === "depends_on"
        );
        return edge && edge.weight >= 2;
      });

      if (blockedHighWeight.length > 0) {
        const severity =
          myScore === 0 && blockedHighWeight.length >= 2
            ? "critical"
            : myScore === 0
            ? "high"
            : "medium";

        weaknesses.push({
          node,
          reason:
            myScore === 0
              ? `Nenhum domínio — bloqueia ${blockedHighWeight.length} conceito(s)`
              : `Apenas exposto — bloqueia ${blockedHighWeight.length} conceito(s)`,
          severity,
          blockedNodes: blockedHighWeight,
        });
      }
    }

    // Also flag: node has errors and blocks others
    if (node.errorCount >= 2 && dependents.length > 0) {
      const existing = weaknesses.find((w) => w.node.id === node.id);
      if (!existing) {
        weaknesses.push({
          node,
          reason: `${node.errorCount} erros registrados — precisa revisão`,
          severity: "medium",
          blockedNodes: dependents,
        });
      }
    }
  }

  return weaknesses.sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2 };
    return sev[a.severity] - sev[b.severity];
  });
}

// ── Graph statistics ──

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  concepts: number;
  formulas: number;
  theorems: number;
  avgMastery: number;
  weaknessCount: number;
  moduleCount: number;
}

export function getGraphStats(): GraphStats {
  const modules = new Set(allNodes.map((n) => n.moduleId));
  const masterySum = allNodes.reduce((sum, n) => sum + MASTERY_SCORE[n.mastery], 0);

  return {
    totalNodes: allNodes.length,
    totalEdges: allEdges.length,
    concepts: allNodes.filter((n) => n.kind === "concept").length,
    formulas: allNodes.filter((n) => n.kind === "formula").length,
    theorems: allNodes.filter((n) => n.kind === "theorem").length,
    avgMastery: masterySum / allNodes.length,
    weaknessCount: getWeaknesses().length,
    moduleCount: modules.size,
  };
}

// ── Module grouping ──

export interface ModuleGroup {
  moduleId: string;
  moduleName: string;
  disciplineId: string;
  nodes: KGNode[];
  avgScore: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

export function getModuleGroups(): ModuleGroup[] {
  const groups = new Map<string, KGNode[]>();
  for (const node of allNodes) {
    const list = groups.get(node.moduleId) ?? [];
    list.push(node);
    groups.set(node.moduleId, list);
  }

  return Array.from(groups.entries()).map(([moduleId, nodes]) => {
    const avgScore = nodes.reduce((s, n) => s + n.score, 0) / nodes.length;
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const pad = 40;
    return {
      moduleId,
      moduleName: nodes[0].moduleName,
      disciplineId: nodes[0].disciplineId,
      nodes,
      avgScore,
      bounds: {
        minX: Math.min(...xs) - pad,
        maxX: Math.max(...xs) + pad,
        minY: Math.min(...ys) - pad,
        maxY: Math.max(...ys) + pad,
      },
    };
  });
}

// ── Pathfinding (BFS shortest dependency path) ──

export function findDependencyPath(fromId: string, toId: string): KGNode[] | null {
  const visited = new Set<string>();
  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (id === toId) return path.map((p) => nodeMap.get(p)!);
    if (visited.has(id)) continue;
    visited.add(id);

    const neighbors = allEdges
      .filter((e) => e.source === id && e.kind === "depends_on")
      .map((e) => e.target);

    for (const next of neighbors) {
      if (!visited.has(next)) {
        queue.push({ id: next, path: [...path, next] });
      }
    }
  }

  return null;
}

// ── Re-exports ──

export { MASTERY_FILL, NODE_RADIUS };
export type { KGNode, KGEdge, NodeKind, EdgeKind };
