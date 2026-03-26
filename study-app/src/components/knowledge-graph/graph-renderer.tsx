"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { KGNode, KGEdge, NodeKind, EdgeKind } from "@/data/knowledge-graph";
import { NODE_RADIUS, NODE_SHAPE, MASTERY_FILL, EDGE_STYLE } from "@/data/knowledge-graph";
import type { ModuleGroup } from "@/lib/knowledge-graph";
import type { Weakness } from "@/lib/knowledge-graph";

interface Props {
  nodes: KGNode[];
  edges: KGEdge[];
  modules: ModuleGroup[];
  weaknesses: Weakness[];
  selectedId?: string;
  hoveredId?: string;
  onSelect: (node: KGNode) => void;
  onHover: (nodeId: string | null) => void;
}

// SVG shape renderers
function renderNodeShape(node: KGNode, isSelected: boolean, isHovered: boolean, isWeak: boolean, isConnected: boolean, dimmed: boolean) {
  const shape = NODE_SHAPE[node.kind];
  const r = NODE_RADIUS[node.kind];
  const fill = MASTERY_FILL[node.mastery];
  const opacity = dimmed ? 0.25 : isHovered ? 1 : 0.85;
  const strokeColor = isSelected ? "#fafafa" : isWeak ? "#ef4444" : "none";
  const strokeWidth = isSelected ? 2.5 : isWeak ? 2 : 0;
  const scale = isHovered ? 1.15 : 1;

  const errorRing = node.errorCount > 0 && !dimmed;

  if (shape === "circle") {
    return (
      <g transform={`translate(${node.x},${node.y}) scale(${scale})`}>
        {errorRing && (
          <circle r={r + 5} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.6} />
        )}
        <circle
          r={r}
          fill={fill}
          opacity={opacity}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </g>
    );
  }

  if (shape === "diamond") {
    const d = r * 1.2;
    const points = `0,${-d} ${d},0 0,${d} ${-d},0`;
    return (
      <g transform={`translate(${node.x},${node.y}) scale(${scale})`}>
        {errorRing && (
          <polygon points={`0,${-(d + 5)} ${d + 5},0 0,${d + 5} ${-(d + 5)},0`} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.6} />
        )}
        <polygon
          points={points}
          fill={fill}
          opacity={opacity}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </g>
    );
  }

  // hexagon
  const hexR = r * 1.1;
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${Math.cos(angle) * hexR},${Math.sin(angle) * hexR}`;
  }).join(" ");

  return (
    <g transform={`translate(${node.x},${node.y}) scale(${scale})`}>
      {errorRing && (
        <polygon
          points={Array.from({ length: 6 }, (_, i) => {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            return `${Math.cos(angle) * (hexR + 5)},${Math.sin(angle) * (hexR + 5)}`;
          }).join(" ")}
          fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.6}
        />
      )}
      <polygon
        points={hexPoints}
        fill={fill}
        opacity={opacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}

function renderEdge(edge: KGEdge, sourceNode: KGNode, targetNode: KGNode, highlighted: boolean, dimmed: boolean) {
  const style = EDGE_STYLE[edge.kind];
  const opacity = dimmed ? 0.08 : highlighted ? 0.8 : 0.35;
  const width = highlighted ? style.width * 1.8 : style.width;

  // Arrow for depends_on
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;

  const targetR = NODE_RADIUS[targetNode.kind] + 4;
  const endX = targetNode.x - (dx / len) * targetR;
  const endY = targetNode.y - (dy / len) * targetR;

  const sourceR = NODE_RADIUS[sourceNode.kind] + 2;
  const startX = sourceNode.x + (dx / len) * sourceR;
  const startY = sourceNode.y + (dy / len) * sourceR;

  return (
    <g key={edge.id}>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={highlighted ? style.color : style.color}
        strokeWidth={width}
        strokeDasharray={style.dash}
        opacity={opacity}
        markerEnd={edge.kind === "depends_on" ? "url(#arrow)" : undefined}
      />
      {edge.label && highlighted && !dimmed && (
        <text
          x={(startX + endX) / 2}
          y={(startY + endY) / 2 - 6}
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize={8}
          fontFamily="var(--font-geist-sans)"
          opacity={0.8}
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

export function GraphRenderer({ nodes, edges, modules, weaknesses, selectedId, hoveredId, onSelect, onHover }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const weakNodeIds = new Set(weaknesses.map((w) => w.node.id));
  const connectedIds = new Set<string>();

  if (hoveredId || selectedId) {
    const activeId = hoveredId ?? selectedId;
    connectedIds.add(activeId!);
    edges.forEach((e) => {
      if (e.source === activeId || e.target === activeId) {
        connectedIds.add(e.source);
        connectedIds.add(e.target);
      }
    });
  }

  const hasActiveHighlight = connectedIds.size > 0;

  // Calculate viewBox to fit all nodes
  const allX = nodes.map((n) => n.x);
  const allY = nodes.map((n) => n.y);
  const minX = Math.min(...allX) - 60;
  const maxX = Math.max(...allX) + 60;
  const minY = Math.min(...allY) - 60;
  const maxY = Math.max(...allY) + 60;
  const vbWidth = maxX - minX;
  const vbHeight = maxY - minY;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.3, Math.min(3, z * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && (e.target as Element).tagName === "svg") {
      setDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-border-default bg-bg-surface">
      <svg
        ref={svgRef}
        viewBox={`${minX} ${minY} ${vbWidth} ${vbHeight}`}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Defs */}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#52525b" opacity={0.6} />
          </marker>
        </defs>

        {/* Module background regions */}
        {modules.map((mod) => (
          <g key={mod.moduleId}>
            <rect
              x={mod.bounds.minX}
              y={mod.bounds.minY}
              width={mod.bounds.maxX - mod.bounds.minX}
              height={mod.bounds.maxY - mod.bounds.minY}
              rx={8}
              fill={mod.disciplineId === "calculo-1" ? "#3b82f6" : "#8b5cf6"}
              opacity={0.04}
              stroke={mod.disciplineId === "calculo-1" ? "#3b82f6" : "#8b5cf6"}
              strokeWidth={0.5}
              strokeOpacity={0.15}
            />
            <text
              x={mod.bounds.minX + 8}
              y={mod.bounds.minY + 14}
              fill={mod.disciplineId === "calculo-1" ? "#3b82f6" : "#8b5cf6"}
              fontSize={9}
              fontFamily="var(--font-geist-sans)"
              fontWeight={600}
              opacity={0.4}
              letterSpacing="0.04em"
            >
              {mod.moduleName.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Edges */}
        {edges.map((edge) => {
          const source = nodes.find((n) => n.id === edge.source);
          const target = nodes.find((n) => n.id === edge.target);
          if (!source || !target) return null;

          const highlighted = connectedIds.has(edge.source) && connectedIds.has(edge.target);
          const dimmed = hasActiveHighlight && !highlighted;

          return renderEdge(edge, source, target, highlighted, dimmed);
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedId === node.id;
          const isHovered = hoveredId === node.id;
          const isWeak = weakNodeIds.has(node.id);
          const isConnected = connectedIds.has(node.id);
          const dimmed = hasActiveHighlight && !isConnected;

          return (
            <g
              key={node.id}
              onClick={(e) => { e.stopPropagation(); onSelect(node); }}
              onMouseEnter={() => onHover(node.id)}
              onMouseLeave={() => onHover(null)}
              className="cursor-pointer"
              style={{ transition: "opacity 0.2s" }}
            >
              {renderNodeShape(node, isSelected, isHovered, isWeak, isConnected, dimmed)}

              {/* Label */}
              <text
                x={node.x}
                y={node.y + NODE_RADIUS[node.kind] + 14}
                textAnchor="middle"
                fill={dimmed ? "#3f3f46" : "#a1a1aa"}
                fontSize={9}
                fontFamily="var(--font-geist-sans)"
              >
                {node.label.length > 20 ? node.label.slice(0, 18) + "…" : node.label}
              </text>

              {/* Score inside node */}
              <text
                x={node.x}
                y={node.y + 3.5}
                textAnchor="middle"
                fill={dimmed ? "#52525b" : "#fafafa"}
                fontSize={8}
                fontFamily="var(--font-geist-mono)"
                fontWeight={500}
              >
                {node.score > 0 ? node.score.toFixed(2) : "—"}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(3, z * 1.2))}
          className="flex h-7 w-7 items-center justify-center rounded border border-border-default bg-bg-primary text-fg-tertiary text-xs hover:bg-bg-secondary"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z * 0.8))}
          className="flex h-7 w-7 items-center justify-center rounded border border-border-default bg-bg-primary text-fg-tertiary text-xs hover:bg-bg-secondary"
        >
          −
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="flex h-7 w-7 items-center justify-center rounded border border-border-default bg-bg-primary text-fg-tertiary text-[9px] hover:bg-bg-secondary"
          title="Reset view"
        >
          ⌂
        </button>
      </div>
    </div>
  );
}
