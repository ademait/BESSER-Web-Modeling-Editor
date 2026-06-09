import type { UMLModel, UMLElement, UMLRelationship } from '@besser/wme';
import { UMLDiagramType } from '@besser/wme';
import type { ElementLineageMap } from '../../shared/types/project';
import type { AgentDerivationResult, AgentDerivationWarning } from './types';

/**
 * 29 — BPMN agentic lane → Agent-diagram (state machine) derivation.
 * Plan: `.claude/inter-diagram/28-lane-to-agent-derivation-plan.md`.
 *
 * Core (this guide): one `AgentState` per task in the lane; intra-lane sequence
 * flows → `AgentStateTransition` (gateways collapsed, DQ-4); entry tasks (no
 * intra-lane predecessor) → a `StateInitialNode` + `AgentStateTransitionInit`
 * (one per entry, DQ-5). Cross-lane I/O boundary states are guide 30.
 *
 * Pure `model → model`; structured refusals/warnings (never throws on user
 * content). `elementMapping[stateId] = taskId` feeds the lineage sidecar.
 */
const STATE_W = 140;
const STATE_H = 40;
const INIT_SIZE = 45;
const V_GAP = 70; // vertical gap between stacked states

const newId = (): string => 'gen-' + Math.random().toString(36).slice(2, 11);

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
type AnyEl = UMLElement & {
  isAgentic?: boolean;
  flowType?: string;
  bounds: Bounds;
};

export function laneToAgentModel(bpmn: UMLModel, laneId: string): AgentDerivationResult {
  const warnings: AgentDerivationWarning[] = [];

  if (bpmn.type !== UMLDiagramType.BPMN) return { ok: false, reason: 'not-a-bpmn-diagram', warnings };

  const lane = bpmn.elements[laneId] as AnyEl | undefined;
  if (!lane || lane.type !== 'BPMNSwimlane') return { ok: false, reason: 'lane-not-found', warnings };
  if (!lane.isAgentic) return { ok: false, reason: 'lane-not-agentic', warnings };

  // Tasks owned by this lane, in BPMN reading order (x then y).
  const tasks = (Object.values(bpmn.elements) as AnyEl[])
    .filter((e) => e.type === 'BPMNTask' && e.owner === laneId)
    .sort((a, b) => a.bounds.x - b.bounds.x || a.bounds.y - b.bounds.y);
  if (tasks.length === 0) return { ok: false, reason: 'no-tasks-in-lane', warnings };

  const out = emptyAgentModel(bpmn.size);
  const elementMapping: ElementLineageMap = {};

  // 1) one AgentState per task, stacked vertically.
  const stateIdByTask = new Map<string, string>();
  tasks.forEach((t, i) => {
    const id = newId();
    out.elements[id] = {
      id,
      name: t.name || 'State',
      type: 'AgentState',
      owner: null,
      bounds: { x: 0, y: i * (STATE_H + V_GAP), width: STATE_W, height: STATE_H },
      bodies: [],
      fallbackBodies: [],
    } as unknown as UMLElement;
    stateIdByTask.set(t.id, id);
    elementMapping[id] = t.id; // lineage: AgentState ← source task
  });

  // 2) intra-lane sequence flows → transitions (collapsing in-lane gateways).
  const taskIds = new Set(tasks.map((t) => t.id));
  const edges = collapseGatewayEdges(bpmn, laneId, taskIds);
  const seen = new Set<string>();
  for (const { from, to } of edges) {
    const s = stateIdByTask.get(from);
    const t = stateIdByTask.get(to);
    if (!s || !t || s === t) continue;
    const key = `${s} ${t}`;
    if (seen.has(key)) continue;
    seen.add(key);
    emitTransition(out, s, t, 'AgentStateTransition', 'vertical');
  }

  // 3) entry tasks (no intra-lane predecessor) → StateInitialNode + init.
  const hasPred = new Set(edges.map((e) => e.to));
  const entries = tasks.filter((t) => !hasPred.has(t.id));
  const entryTasks = entries.length > 0 ? entries : [tasks[0]]; // pure-cycle fallback
  for (const t of entryTasks) {
    const stateId = stateIdByTask.get(t.id)!;
    const sb = (out.elements[stateId] as unknown as { bounds: Bounds }).bounds;
    const initId = newId();
    out.elements[initId] = {
      id: initId,
      name: '',
      type: 'StateInitialNode',
      owner: null,
      bounds: { x: sb.x - 110, y: sb.y - 2, width: INIT_SIZE, height: INIT_SIZE },
    } as unknown as UMLElement;
    emitTransition(out, initId, stateId, 'AgentStateTransitionInit', 'horizontal');
  }

  return { ok: true, model: out, warnings, elementMapping };
}

// ── helpers ─────────────────────────────────────────────────────────

function emptyAgentModel(size: { width: number; height: number }): UMLModel {
  return {
    version: '3.0.0',
    type: UMLDiagramType.AgentDiagram,
    size,
    elements: {},
    interactive: { elements: {}, relationships: {} },
    relationships: {},
    assessments: {},
  } as unknown as UMLModel;
}

/**
 * Build task→task edges from intra-lane sequence flows, collapsing in-lane
 * gateways (DQ-4): a flow task→gateway→…→task yields a direct task→task edge.
 * Flows leaving the lane (cross-lane) are ignored here — guide 30 handles I/O.
 */
function collapseGatewayEdges(
  bpmn: UMLModel,
  laneId: string,
  taskIds: Set<string>,
): Array<{ from: string; to: string }> {
  const seqFlows = (Object.values(bpmn.relationships) as Array<UMLRelationship & { flowType?: string }>).filter(
    (r) => r.type === 'BPMNFlow' && r.flowType === 'sequence',
  );
  // outgoing adjacency by source node id
  const outAdj = new Map<string, string[]>();
  for (const f of seqFlows) {
    const arr = outAdj.get(f.source.element) ?? [];
    arr.push(f.target.element);
    outAdj.set(f.source.element, arr);
  }
  const isLaneGateway = (id: string): boolean => {
    const el = bpmn.elements[id] as AnyEl | undefined;
    return !!el && el.type === 'BPMNGateway' && el.owner === laneId;
  };
  // walk forward from a node to the set of tasks-in-lane reachable through
  // lane gateways only (no cross-lane traversal).
  const forwardTasks = (startNodeId: string): string[] => {
    const found = new Set<string>();
    const stack = [startNodeId];
    const visited = new Set<string>();
    while (stack.length) {
      const n = stack.pop()!;
      if (visited.has(n)) continue;
      visited.add(n);
      if (taskIds.has(n)) {
        found.add(n);
        continue;
      }
      if (isLaneGateway(n)) for (const nxt of outAdj.get(n) ?? []) stack.push(nxt);
      // anything else (cross-lane node, event) is a dead end for v1 core.
    }
    return [...found];
  };

  const edges: Array<{ from: string; to: string }> = [];
  for (const f of seqFlows) {
    if (!taskIds.has(f.source.element)) continue; // edges start at a task in the lane
    for (const tgt of forwardTasks(f.target.element)) edges.push({ from: f.source.element, to: tgt });
  }
  return edges;
}

function emitTransition(
  out: UMLModel,
  srcId: string,
  tgtId: string,
  type: 'AgentStateTransition' | 'AgentStateTransitionInit',
  orientation: 'vertical' | 'horizontal',
): void {
  const id = newId();
  const sb = (out.elements[srcId] as unknown as { bounds: Bounds }).bounds;
  const tb = (out.elements[tgtId] as unknown as { bounds: Bounds }).bounds;
  const p0 =
    orientation === 'vertical'
      ? { x: sb.x + sb.width / 2, y: sb.y + sb.height }
      : { x: sb.x + sb.width, y: sb.y + sb.height / 2 };
  const p1 = orientation === 'vertical' ? { x: tb.x + tb.width / 2, y: tb.y } : { x: tb.x, y: tb.y + tb.height / 2 };
  out.relationships[id] = {
    id,
    name: '',
    type,
    owner: null,
    bounds: {
      x: Math.min(p0.x, p1.x),
      y: Math.min(p0.y, p1.y),
      width: Math.max(1, Math.abs(p1.x - p0.x)),
      height: Math.max(1, Math.abs(p1.y - p0.y)),
    },
    path: [p0, p1],
    source: { element: srcId, direction: orientation === 'vertical' ? 'Down' : 'Right' },
    target: { element: tgtId, direction: orientation === 'vertical' ? 'Up' : 'Left' },
    isManuallyLayouted: false,
  } as unknown as UMLRelationship;
}
