// ============================================================
// Graph Intelligence — Learning paths, blockers, unlocks
// The "brain" that powers Jarvis 3.0 decisions via knowledge graph
// ============================================================

import type { KgNode, KgEdge, MasteryLevel } from '../supabase'
import { getGraphWithMastery, getPrerequisites, getDependents, type GraphWithMastery } from './knowledge-graph'

// ── Types ───────────────────────────────────────────────────

export interface LearningPathNode {
  id: string
  label: string
  mastery: MasteryLevel
  score: number
  estimatedHours: number
  order: number
  isTarget: boolean
  kind: string
}

export interface LearningPath {
  target: string
  nodes: LearningPathNode[]
  totalEstimatedHours: number
  blockerCount: number
}

export interface BlockerNode {
  id: string
  label: string
  mastery: MasteryLevel
  score: number
  dependentCount: number
  impactScore: number // dependentCount × (1 - score)
  kind: string
}

export interface UnlockedNode {
  id: string
  label: string
  mastery: MasteryLevel
  reason: string
}

export interface PathOverlayData {
  nodeIds: string[]
  edgeIds: { source: string; target: string }[]
  order: Map<string, number>
}

export interface ReadinessReport {
  assessmentName: string
  readinessScore: number // 0-100
  topicStatuses: {
    name: string
    mastery: MasteryLevel
    score: number
    isBlocked: boolean
    blockedBy?: string[]
  }[]
  criticalGaps: string[]
  blockerChain: BlockerNode[]
}

// ── Mastery utilities ───────────────────────────────────────

const MASTERY_THRESHOLD: Record<MasteryLevel, number> = {
  none: 0,
  exposed: 0.2,
  developing: 0.4,
  proficient: 0.7,
  mastered: 0.9,
}

function masteryToScore(m: MasteryLevel): number {
  return MASTERY_THRESHOLD[m] ?? 0
}

function estimateStudyHours(mastery: MasteryLevel, kind: string): number {
  const base: Record<string, number> = { concept: 1.5, formula: 1, theorem: 2 }
  const multiplier: Record<MasteryLevel, number> = {
    none: 1.0, exposed: 0.8, developing: 0.5, proficient: 0.2, mastered: 0,
  }
  return (base[kind] ?? 1.5) * (multiplier[mastery] ?? 1)
}

function isMasteryWeak(m: MasteryLevel): boolean {
  return m === 'none' || m === 'exposed'
}

function isMasteryStrong(m: MasteryLevel): boolean {
  return m === 'proficient' || m === 'mastered'
}

// ── Core algorithms ─────────────────────────────────────────

/**
 * Find the optimal learning path to master a target topic.
 * Uses topological sort of prerequisites, filtering only weak nodes.
 */
export async function findLearningPath(targetNodeId: string): Promise<LearningPath> {
  const graph = await getGraphWithMastery()
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]))
  const target = nodeMap.get(targetNodeId)
  if (!target) throw new Error(`Node ${targetNodeId} not found`)

  // BFS backwards through prerequisites
  const visited = new Set<string>()
  const queue = [targetNodeId]
  const prereqOrder: string[] = []

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)

    const prereqs = getPrerequisites(current, graph)
    for (const prereq of prereqs) {
      if (!visited.has(prereq.id)) {
        queue.push(prereq.id)
      }
    }
    prereqOrder.push(current)
  }

  // Reverse to get topological order (prereqs first)
  prereqOrder.reverse()

  // Build path nodes — include weak ones + the target
  const pathNodes: LearningPathNode[] = []
  let order = 0
  for (const nodeId of prereqOrder) {
    const node = nodeMap.get(nodeId)
    if (!node) continue
    const mastery = (node.mastery ?? 'none') as MasteryLevel
    // Include if weak or is the target
    if (!isMasteryStrong(mastery) || nodeId === targetNodeId) {
      pathNodes.push({
        id: node.id,
        label: node.label,
        mastery,
        score: node.score ?? 0,
        estimatedHours: estimateStudyHours(mastery, node.kind),
        order: order++,
        isTarget: nodeId === targetNodeId,
        kind: node.kind,
      })
    }
  }

  return {
    target: target.label,
    nodes: pathNodes,
    totalEstimatedHours: pathNodes.reduce((s, n) => s + n.estimatedHours, 0),
    blockerCount: pathNodes.filter(n => isMasteryWeak(n.mastery) && !n.isTarget).length,
  }
}

/**
 * Find high-impact blocker nodes for a set of assessment topics.
 * A blocker is a weak prerequisite that blocks many exam topics.
 */
export async function findBlockerNodes(assessmentTopicIds: string[]): Promise<BlockerNode[]> {
  const graph = await getGraphWithMastery()
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]))

  // For each assessment topic, traverse prerequisites
  const blockerScores = new Map<string, { node: GraphWithMastery['nodes'][number]; dependentCount: number }>()

  for (const topicId of assessmentTopicIds) {
    // Find kg_node for this topic
    const topicNode = graph.nodes.find(n => n.topic_id === topicId)
    if (!topicNode) continue

    const visited = new Set<string>()
    const queue = [topicNode.id]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)

      const node = nodeMap.get(current)
      if (!node) continue
      const mastery = (node.mastery ?? 'none') as MasteryLevel

      if (isMasteryWeak(mastery) && current !== topicNode.id) {
        const entry = blockerScores.get(current) ?? { node, dependentCount: 0 }
        entry.dependentCount++
        blockerScores.set(current, entry)
      }

      const prereqs = getPrerequisites(current, graph)
      for (const prereq of prereqs) {
        if (!visited.has(prereq.id)) queue.push(prereq.id)
      }
    }
  }

  return Array.from(blockerScores.entries())
    .map(([id, { node, dependentCount }]) => {
      const mastery = (node.mastery ?? 'none') as MasteryLevel
      const score = node.score ?? 0
      return {
        id,
        label: node.label,
        mastery,
        score,
        dependentCount,
        impactScore: dependentCount * (1 - score),
        kind: node.kind,
      }
    })
    .sort((a, b) => b.impactScore - a.impactScore)
}

/**
 * Check which topics are unlocked after mastering a given topic.
 */
export async function checkUnlocks(masteredNodeId: string): Promise<UnlockedNode[]> {
  const graph = await getGraphWithMastery()
  const dependents = getDependents(masteredNodeId, graph)
  const unlocked: UnlockedNode[] = []

  for (const dep of dependents) {
    // Check if ALL prerequisites of this dependent are now strong
    const allPrereqs = getPrerequisites(dep.id, graph)
    const allSatisfied = allPrereqs.every(prereq => {
      if (prereq.id === masteredNodeId) return true
      const mastery = (prereq.mastery ?? 'none') as MasteryLevel
      return isMasteryStrong(mastery)
    })

    if (allSatisfied) {
      unlocked.push({
        id: dep.id,
        label: dep.label,
        mastery: (dep.mastery ?? 'none') as MasteryLevel,
        reason: `Todos os pré-requisitos satisfeitos`,
      })
    }
  }

  return unlocked
}

/**
 * Generate overlay data for visualizing a learning path on the knowledge graph.
 */
export function generatePathOverlay(path: LearningPath): PathOverlayData {
  const nodeIds = path.nodes.map(n => n.id)
  const edgeIds: { source: string; target: string }[] = []
  const order = new Map<string, number>()

  for (let i = 0; i < path.nodes.length; i++) {
    order.set(path.nodes[i].id, i)
    if (i > 0) {
      edgeIds.push({ source: path.nodes[i - 1].id, target: path.nodes[i].id })
    }
  }

  return { nodeIds, edgeIds, order }
}

/**
 * Generate a readiness report for an assessment.
 */
export async function generateReadinessReport(
  assessmentName: string,
  assessmentTopicIds: string[],
): Promise<ReadinessReport> {
  const graph = await getGraphWithMastery()
  const nodeMap = new Map(graph.nodes.map(n => [n.topic_id, n]))
  const blockers = await findBlockerNodes(assessmentTopicIds)

  const topicStatuses = assessmentTopicIds.map(tid => {
    const node = nodeMap.get(tid)
    const mastery = (node?.mastery ?? 'none') as MasteryLevel
    const score = node?.score ?? 0

    // Check if blocked by weak prerequisites
    const prereqs = node ? getPrerequisites(node.id, graph) : []
    const weakPrereqs = prereqs.filter(p => isMasteryWeak((p.mastery ?? 'none') as MasteryLevel))

    return {
      name: node?.label ?? tid,
      mastery,
      score,
      isBlocked: weakPrereqs.length > 0,
      blockedBy: weakPrereqs.length > 0 ? weakPrereqs.map(p => p.label) : undefined,
    }
  })

  // Readiness score: weighted average of topic scores (0-100)
  const readinessScore = topicStatuses.length > 0
    ? Math.round(topicStatuses.reduce((s, t) => s + t.score, 0) / topicStatuses.length * 100)
    : 0

  const criticalGaps = topicStatuses
    .filter(t => isMasteryWeak(t.mastery))
    .map(t => t.name)

  return {
    assessmentName,
    readinessScore,
    topicStatuses,
    criticalGaps,
    blockerChain: blockers.slice(0, 5),
  }
}
