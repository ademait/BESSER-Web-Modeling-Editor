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
// 30 — boundary-state columns: inputs to the left of the init node (-110),
// outputs to the right of the task chain (0..STATE_W).
const INPUT_COL_X = -340;
const OUTPUT_COL_X = 340;
const BOUNDARY_W = 160;
const BOUNDARY_H = 40;

const newId = (): string => 'gen-' + Math.random().toString(36).slice(2, 11);

/**
 * 04 (item 17b) — BAF / the BESSER agent converter reject state names with
 * spaces ("Name cannot contain spaces"). Collapse whitespace to underscores and
 * trim so every derived AgentState.name is a valid identifier-ish token. Boundary
 * states become `from_<Peer>` / `to_<Peer>` — the exact contract guide 05's
 * generator matches on (it re-applies `_safe_service_name` to the suffix, so case
 * and camelCase differences vs the service name are reconciled there).
 */
const sanitizeStateName = (raw: string): string => {
  const s = (raw || '').trim().replace(/\s+/g, '_');
  return s || 'State';
};

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
      name: sanitizeStateName(t.name || 'State'),
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

  // 3) entry tasks (no intra-lane predecessor).
  const hasPred = new Set(edges.map((e) => e.to));
  const entries = tasks.filter((t) => !hasPred.has(t.id));
  const entryTasks = entries.length > 0 ? entries : [tasks[0]]; // pure-cycle fallback

  // 30 — cross-lane flows → «input»/«output» boundary states (DQ-1 Option A).
  // Runs BEFORE the init pass: it returns the task-states a cross-lane input
  // already drives, so we can suppress their StateInitialNode (30-FU1 — an
  // input-fed entry must not ALSO get a cold-start marker; two start points is
  // not a valid state machine, manual test IO-4/IO-6).
  const entryStateId = stateIdByTask.get(entryTasks[0].id)!;
  const inputFedStateIds = appendBoundaryStates(out, bpmn, laneId, taskIds, stateIdByTask, entryStateId, warnings);

  // entry tasks → StateInitialNode + init, EXCEPT those an «input» already drives.
  // 04 (item 17a): BAF requires EXACTLY ONE initial state. When every entry task
  // is «input»-fed, the loop below emits none → invalid agent. Track whether any
  // init was emitted and, if not, force one on the first entry state so the
  // derived agent always has a cold-start marker.
  let emittedInit = false;
  const emitInitFor = (stateId: string): void => {
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
    emittedInit = true;
  };

  for (const t of entryTasks) {
    const stateId = stateIdByTask.get(t.id)!;
    if (inputFedStateIds.has(stateId)) continue; // 30-FU1 — already entered via «input»
    emitInitFor(stateId);
  }
  // item 17a — all entries were «input»-fed (or none qualified): still guarantee one.
  if (!emittedInit) emitInitFor(stateIdByTask.get(entryTasks[0].id)!);

  // 30-FU1 — final layout normalization: straddle the origin so the diagram
  // opens centered (mirrors bpmn-to-component recenterModelOnOrigin).
  recenterAgentModel(out);

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

// ── 30: cross-lane I/O boundary states ──────────────────────────────

/**
 * For every flow crossing the lane boundary, emit a `«input»`/`«output»`
 * boundary `AgentState` (deduped per direction+external name) and wire it to
 * the in-lane task-state it touches. Synthetic — no lineage entry.
 */
function appendBoundaryStates(
  out: UMLModel,
  bpmn: UMLModel,
  laneId: string,
  taskIds: Set<string>,
  stateIdByTask: Map<string, string>,
  entryStateId: string,
  warnings: AgentDerivationWarning[],
): Set<string> {
  const flows = (Object.values(bpmn.relationships) as Array<UMLRelationship & { flowType?: string }>).filter(
    (r) => r.type === 'BPMNFlow' && (r.flowType === 'sequence' || r.flowType === 'message'),
  );

  // dedup: boundary state per `${dir}\x00${name}`, transitions per `${bId}\x00${sId}`
  const boundaryIdByKey = new Map<string, string>();
  const transSeen = new Set<string>();
  // 30-FU1 — task-states an «input» drives; their cold-start init is suppressed
  // by the caller (returned at the end). The entry-fallback case below does NOT
  // add to this set, so a degenerate unresolved input keeps a guaranteed start.
  const inputFed = new Set<string>();
  let inputRow = 0;
  let outputRow = 0;

  const ensureBoundary = (dir: 'input' | 'output', name: string): string => {
    const key = `${dir}\x00${name}`;
    const existing = boundaryIdByKey.get(key);
    if (existing) return existing;
    const id = newId();
    const row = dir === 'input' ? inputRow++ : outputRow++;
    out.elements[id] = {
      id,
      name: sanitizeStateName(dir === 'input' ? `from ${name}` : `to ${name}`),
      type: 'AgentState',
      owner: null,
      stereotype: dir, // «input» / «output»
      bounds: {
        x: dir === 'input' ? INPUT_COL_X : OUTPUT_COL_X,
        y: row * (BOUNDARY_H + V_GAP),
        width: BOUNDARY_W,
        height: BOUNDARY_H,
      },
      bodies: [],
      fallbackBodies: [],
    } as unknown as UMLElement;
    boundaryIdByKey.set(key, id);
    return id;
  };

  for (const f of flows) {
    // 30-FU1 — direction fix: an INPUT lands on the in-lane TARGET and flows
    // FORWARD through in-lane gateways to the consuming task(s); an OUTPUT
    // leaves the in-lane SOURCE, produced by task(s) reachable BACKWARD. (The
    // pre-FU1 args were swapped — harmless for a direct task↔task crossing, but
    // wrong for a gateway-mediated one, which then fell back to entry: IO-6.)
    const srcInLane = inLaneTasks(bpmn, laneId, taskIds, f.source.element, 'backward');
    const tgtInLane = inLaneTasks(bpmn, laneId, taskIds, f.target.element, 'forward');
    const sourceIsInLane = isInLaneNode(bpmn, laneId, f.source.element);
    const targetIsInLane = isInLaneNode(bpmn, laneId, f.target.element);

    // INPUT: target side in lane, source side external.
    if (targetIsInLane && !sourceIsInLane) {
      const name = externalName(bpmn, f.source.element);
      const bId = ensureBoundary('input', name);
      if (tgtInLane.length > 0) {
        for (const t of tgtInLane) {
          const sId = stateIdByTask.get(t)!;
          inputFed.add(sId); // 30-FU1 — this entry's cold-start init is suppressed
          wireBoundary(out, bId, sId, 'input', transSeen);
        }
      } else {
        // Unresolved in-lane endpoint → attach to the entry state and warn
        // (never silently drop). The entry KEEPS its init (a guaranteed
        // cold-start for this degenerate case) → NOT added to inputFed.
        warnings.push({ kind: 'io-attached-to-entry', flowId: f.id });
        wireBoundary(out, bId, entryStateId, 'input', transSeen);
      }
      continue;
    }
    // OUTPUT: source side in lane, target side external.
    if (sourceIsInLane && !targetIsInLane) {
      const name = externalName(bpmn, f.target.element);
      const bId = ensureBoundary('output', name);
      const sources = srcInLane.length > 0 ? srcInLane.map((t) => stateIdByTask.get(t)!) : [entryStateId];
      if (srcInLane.length === 0) warnings.push({ kind: 'io-attached-to-entry', flowId: f.id });
      for (const sId of sources) wireBoundary(out, bId, sId, 'output', transSeen);
    }
  }
  return inputFed;
}

function wireBoundary(
  out: UMLModel,
  boundaryId: string,
  taskStateId: string,
  dir: 'input' | 'output',
  seen: Set<string>,
): void {
  const key = `${boundaryId}\x00${taskStateId}`;
  if (seen.has(key)) return;
  seen.add(key);
  // input: boundary → task; output: task → boundary.
  if (dir === 'input') emitTransition(out, boundaryId, taskStateId, 'AgentStateTransition', 'horizontal');
  else emitTransition(out, taskStateId, boundaryId, 'AgentStateTransition', 'horizontal');
}

/** True iff the node is a task or gateway owned by the lane. */
function isInLaneNode(bpmn: UMLModel, laneId: string, nodeId: string): boolean {
  const el = bpmn.elements[nodeId] as (UMLElement & { owner?: string }) | undefined;
  return !!el && (el.type === 'BPMNTask' || el.type === 'BPMNGateway') && el.owner === laneId;
}

/**
 * Resolve an in-lane endpoint to the concrete in-lane task(s) it represents:
 * a task → itself; an in-lane gateway → tasks reachable through in-lane
 * gateways (`forward` follows outgoing flows, `backward` incoming). Returns
 * [] for a non-lane node.
 */
function inLaneTasks(
  bpmn: UMLModel,
  laneId: string,
  taskIds: Set<string>,
  nodeId: string,
  dir: 'forward' | 'backward',
): string[] {
  if (taskIds.has(nodeId)) return [nodeId];
  const el = bpmn.elements[nodeId] as (UMLElement & { owner?: string }) | undefined;
  if (!el || el.type !== 'BPMNGateway' || el.owner !== laneId) return [];
  const flows = (Object.values(bpmn.relationships) as Array<UMLRelationship & { flowType?: string }>).filter(
    (r) => r.type === 'BPMNFlow' && r.flowType === 'sequence',
  );
  const found = new Set<string>();
  const stack = [nodeId];
  const visited = new Set<string>();
  while (stack.length) {
    const n = stack.pop()!;
    if (visited.has(n)) continue;
    visited.add(n);
    if (n !== nodeId && taskIds.has(n)) {
      found.add(n);
      continue;
    }
    const nextIds = flows
      .filter((f) => (dir === 'forward' ? f.source.element === n : f.target.element === n))
      .map((f) => (dir === 'forward' ? f.target.element : f.source.element));
    for (const nx of nextIds) {
      const nel = bpmn.elements[nx] as (UMLElement & { owner?: string }) | undefined;
      if (taskIds.has(nx)) found.add(nx);
      else if (nel?.type === 'BPMNGateway' && nel.owner === laneId) stack.push(nx);
    }
  }
  return [...found];
}

/**
 * Human-readable name for an external endpoint, lane-first per DQ-2: the
 * swimlane it belongs to (the *other agent*), else its pool, else the element's
 * own name, else 'External'. 30-FU1 — walks the FULL owner chain (task→lane→pool
 * or task→pool) instead of only the direct owner, so a nested endpoint still
 * resolves to its lane. NOTE: when the external node isn't linked to a lane at
 * all (e.g. a free-floating task, owner unset), this correctly falls through to
 * the node's own name — that is why IO-1 ("from <task>") and IO-6 ("from <lane>")
 * can differ: it reflects what the crossing flow was actually drawn to.
 */
function externalName(bpmn: UMLModel, nodeId: string): string {
  const el = bpmn.elements[nodeId] as (UMLElement & { owner?: string }) | undefined;
  if (!el) return 'External';
  if (el.type === 'BPMNSwimlane') return el.name || 'External';
  if (el.type === 'BPMNPool') return el.name || 'External';
  let firstPool: (UMLElement & { owner?: string }) | undefined;
  const guard = new Set<string>();
  let cur = el.owner ? (bpmn.elements[el.owner] as (UMLElement & { owner?: string }) | undefined) : undefined;
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    if (cur.type === 'BPMNSwimlane') return cur.name || 'External'; // the other agent (DQ-2)
    if (cur.type === 'BPMNPool' && !firstPool) firstPool = cur;
    cur = cur.owner ? (bpmn.elements[cur.owner] as (UMLElement & { owner?: string }) | undefined) : undefined;
  }
  if (firstPool) return firstPool.name || 'External';
  return el.name || 'External';
}

/**
 * 30-FU1 — translate the whole model so its bounding-box midpoint sits on the
 * origin. The editor sizes the canvas symmetrically around (0,0) and the scroll
 * container opens at top-left (uml-diagram.ts), so off-origin content opens
 * scrolled into empty space. Mirrors bpmn-to-component's recenterModelOnOrigin:
 * translates element bounds + relationship bounds/path by the same delta so
 * edges stay attached. No-op for already-origin-centered output.
 */
function recenterAgentModel(out: UMLModel): void {
  const els = Object.values(out.elements);
  if (els.length === 0) return;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const e of els) {
    const b = (e as unknown as { bounds: Bounds }).bounds;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  const dx = -(minX + maxX) / 2;
  const dy = -(minY + maxY) / 2;
  if (dx === 0 && dy === 0) return;
  for (const e of els) {
    const b = (e as unknown as { bounds: Bounds }).bounds;
    b.x += dx;
    b.y += dy;
  }
  for (const r of Object.values(out.relationships)) {
    const rel = r as unknown as { bounds: { x: number; y: number }; path?: Array<{ x: number; y: number }> };
    rel.bounds.x += dx;
    rel.bounds.y += dy;
    if (rel.path)
      for (const p of rel.path) {
        p.x += dx;
        p.y += dy;
      }
  }
}
