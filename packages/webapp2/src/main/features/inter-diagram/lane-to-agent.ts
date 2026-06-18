import type { UMLModel, UMLElement, UMLRelationship } from '@besser/wme';
import { UMLDiagramType } from '@besser/wme';
import type { ElementLineageMap } from '../../shared/types/project';
import type { AgentDerivationResult, AgentDerivationWarning } from './types';
import { resolveEdgeKind, type AgenticEdgeKind } from './bpmn-to-component';

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
// 45 — scaffolded AgentIntent elements + the inbound-intent edges originate at a
// column left of the greeting/init node (the old INPUT_COL_X slot, now free since
// the «input» boundary states are gone).
const INTENT_COL_X = -340;
// 39 (4c) — reflection-scaffold column: extra states (self-eval / cross-review /
// human-approval) sit between the task column (x 0..140) and the right, so they
// don't overlap the task column.
const REFLECT_COL_X = 160;

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
  const s = (raw || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
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
  // 39 — read on BPMN tasks to pick the reflection scaffold ('none' = skip).
  reflectionMode?: 'none' | 'self' | 'cross' | 'human';
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

  const entryStateId = stateIdByTask.get(entryTasks[0].id)!;

  // 39 (4c) — reflection scaffolds: each task with reflectionMode !== 'none' gets
  // self-eval / cross-review / human-approval states spliced after its task-state,
  // re-routing the task's forward edge(s) through them. Runs after the intra-lane
  // transitions and before the greeting/I/O wrap so the entry's INCOMING wiring is
  // untouched.
  appendReflectionScaffolds(out, tasks, stateIdByTask);

  // 36 — BAF greeting wrapper: a thin initial state so the agent never enters an
  // LLM-body state on session start (session.event is None then → AttributeError
  // in reply_llm.predict). StateInitialNode → greeting → first-entry via
  // when_no_intent_matched.
  const greetName = sanitizeStateName((lane.name || 'Agent') + '_greet');
  const greetId = newId();
  const greetY = -(STATE_H + V_GAP); // one layout-row above first task (y=0)
  out.elements[greetId] = {
    id: greetId,
    name: greetName,
    type: 'AgentState',
    owner: null,
    bounds: { x: 0, y: greetY, width: STATE_W, height: STATE_H },
    bodies: [],
    fallbackBodies: [],
  } as unknown as UMLElement;
  const initId = newId();
  out.elements[initId] = {
    id: initId,
    name: '',
    type: 'StateInitialNode',
    owner: null,
    bounds: { x: -110, y: greetY - 2, width: INIT_SIZE, height: INIT_SIZE },
  } as unknown as UMLElement;
  emitTransition(out, initId, greetId, 'AgentStateTransitionInit', 'horizontal');

  // 45 (memo 44) — cross-lane I/O. Inbound from an AGENTIC peer → a
  // when_intent_matched edge greeting → consuming task (intentName recv_<peer>,
  // hidden a2a:in tag in `name`) + a scaffolded AgentIntent. Inbound from a
  // non-agentic lane / start event → nothing (DQ-3). Outbound → an a2a:out
  // tag on the producing state's description. Runs BEFORE the cold-start so
  // we can suppress the cold-start when the entry task already has an intent
  // transition (prevents two visually-identical arrows from greeting → entry).
  const intentTargetStates = appendCrossLaneIO(
    out,
    bpmn,
    lane,
    laneId,
    taskIds,
    stateIdByTask,
    greetId,
    elementMapping,
    warnings,
  );

  // 45-FU — cold-start suppressed when the entry task already received an
  // agentic-inbound intent transition (they would otherwise visually overlap).
  // When no intents exist (non-swarm agent), the cold-start is still needed so
  // BAF can leave greeting on session start (None event).
  if (!intentTargetStates.has(entryStateId)) {
    emitTransition(out, greetId, entryStateId, 'AgentStateTransition', 'vertical', 'when_no_intent_matched');
  }

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
  predefinedType?: string,
  opts?: { intentName?: string; name?: string }, // 45 — A2A intent + hidden tag
): string {
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
    name: opts?.name ?? '',
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
    // 36 — when_no_intent_matched (and other predefined types) need these three
    // fields so the BESSER backend's AgentStateTransition deserializer reads the
    // correct predefinedType instead of falling back to 'when_intent_matched'.
    // 45-FU: intentName must also be at top-level so AgentStateTransition
    // constructor (which reads values.intentName, not values.predefined.intentName)
    // populates this.intentName correctly on first load.
    ...(predefinedType !== undefined
      ? {
          transitionType: 'predefined' as const,
          predefined:
            opts?.intentName !== undefined
              ? { predefinedType, intentName: opts.intentName }
              : { predefinedType, conditionValue: '' },
          ...(opts?.intentName !== undefined ? { intentName: opts.intentName } : {}),
          custom: { condition: [] as string[] },
        }
      : {}),
  } as unknown as UMLRelationship;
  return id;
}

// ── 45: cross-lane I/O (replaces guide-30 boundary states) ──────────

/**
 * 45 (memo 44) — for every flow crossing the lane boundary:
 *  - INPUT (target in lane, source external) from an AGENTIC peer lane → a
 *    `when_intent_matched` transition greeting → consuming task-state, with a
 *    visible `recv_<peer>` intent and a hidden `a2a:in` tag in `name`; plus a
 *    deduped `AgentIntent` scaffold. Non-agentic / start-event source → skip
 *    (the greeting cold-start is the channel, DQ-3).
 *  - OUTPUT (source in lane, target external) → append an `a2a:out` line to the
 *    producing task-state's `description` (kind omitted for non-agentic peers).
 * Pure model mutation; lineage stamped for inbound transitions.
 * Returns the set of task-state IDs that received a when_intent_matched
 * transition from greetId (used to suppress the cold-start for those states).
 */
function appendCrossLaneIO(
  out: UMLModel,
  bpmn: UMLModel,
  lane: AnyEl,
  laneId: string,
  taskIds: Set<string>,
  stateIdByTask: Map<string, string>,
  greetId: string,
  elementMapping: ElementLineageMap,
  warnings: AgentDerivationWarning[],
): Set<string> {
  const flows = (Object.values(bpmn.relationships) as Array<UMLRelationship & { flowType?: string }>).filter(
    (r) => r.type === 'BPMNFlow' && (r.flowType === 'sequence' || r.flowType === 'message'),
  );

  const intentIdByName = new Map<string, string>(); // dedup scaffolded AgentIntents
  let intentRow = 0;
  const outOrderByState = new Map<string, number>(); // running a2a:out order per producing state
  const intentTargetStates = new Set<string>(); // states that received a when_intent_matched edge

  for (const f of flows) {
    const sourceIsInLane = isInLaneNode(bpmn, laneId, f.source.element);
    const targetIsInLane = isInLaneNode(bpmn, laneId, f.target.element);

    // INPUT: target in lane, source external.
    if (targetIsInLane && !sourceIsInLane) {
      const peerLane = externalLaneElement(bpmn, f.source.element);
      // DQ-3: only an AGENTIC peer lane becomes an A2A intent; everything else
      // (pool, start event, human/external lane) folds into the cold-start.
      if (!peerLane || peerLane.isAgentic !== true) continue;
      const peerName = externalName(bpmn, f.source.element);
      const consuming = inLaneTasks(bpmn, laneId, taskIds, f.target.element, 'forward');
      if (consuming.length === 0) {
        warnings.push({ kind: 'io-attached-to-entry', flowId: f.id });
        continue; // unresolved agentic input: cold-start covers the entry
      }
      const kind = resolveEdgeKind(peerLane as UMLElement, lane as UMLElement, undefined);
      const ref = peerLane.agentDiagramRef;
      const tag = a2aTag({ dir: 'in', peer: peerName, ref, flow: f.id, kind });
      // one intent per (peer, consuming task): recv_<peer>_<task>
      for (const taskId of consuming) {
        const sId = stateIdByTask.get(taskId)!;
        const taskName = sanitizeStateName((bpmn.elements[taskId] as AnyEl).name || 'Task');
        const intent = recvIntentName(peerName, taskName);
        if (!intentIdByName.has(intent)) {
          intentIdByName.set(intent, createIntentScaffold(out, intent, peerName, intentRow++));
        }
        const tId = emitTransition(out, greetId, sId, 'AgentStateTransition', 'vertical', 'when_intent_matched', {
          intentName: intent,
          name: tag,
        });
        intentTargetStates.add(sId);
        elementMapping[tId] = f.id; // lineage: inbound intent ← inducing flow
      }
      continue;
    }

    // OUTPUT: source in lane, target external.
    if (sourceIsInLane && !targetIsInLane) {
      const producing = inLaneTasks(bpmn, laneId, taskIds, f.source.element, 'backward');
      const states = producing.length > 0 ? producing.map((t) => stateIdByTask.get(t)!) : [];
      if (states.length === 0) {
        warnings.push({ kind: 'io-attached-to-entry', flowId: f.id });
        continue;
      }
      const peerLane = externalLaneElement(bpmn, f.target.element);
      const peerName = externalName(bpmn, f.target.element);
      const kind =
        peerLane && peerLane.isAgentic === true
          ? resolveEdgeKind(lane as UMLElement, peerLane as UMLElement, undefined)
          : undefined; // non-agentic sink → plain channel, no kind
      const ref = peerLane?.agentDiagramRef;
      for (const sId of states) {
        const order = (outOrderByState.get(sId) ?? 0) + 1;
        outOrderByState.set(sId, order);
        const tag = a2aTag({ dir: 'out', peer: peerName, ref, flow: f.id, order, kind });
        const el = out.elements[sId] as unknown as { description?: string };
        el.description = el.description ? `${el.description}\n${tag}` : tag;
      }
    }
  }
  return intentTargetStates;
}

/**
 * 45 — a scaffolded `AgentIntent` element (DQ-5) so `when_intent_matched` binds
 * to a declared intent. Placeholder description; user adds training phrases.
 * Laid out in a column left of the greeting/init node.
 */
function createIntentScaffold(out: UMLModel, intentName: string, peerName: string, row: number): string {
  const id = newId();
  out.elements[id] = {
    id,
    name: intentName,
    type: 'AgentIntent',
    owner: null,
    bounds: { x: INTENT_COL_X, y: row * (STATE_H + V_GAP), width: STATE_W, height: STATE_H },
    bodies: [],
    intent_description: `Incoming message from ${peerName} (auto-scaffolded; add training phrases).`,
  } as unknown as UMLElement;
  return id;
}

/**
 * True iff the node belongs to the lane. Membership is by OWNERSHIP, not element
 * type: a lane owns its flow nodes — tasks, gateways AND events (start/end/
 * intermediate). item 22 — the pre-fix test recognized only tasks/gateways, so a
 * lane's own `BPMNStartEvent` read as *external*; the intra-lane `StartEvent →
 * entryTask` flow was then misclassified as a cross-lane INPUT and produced a
 * self-referential `from_<thisLane>` boundary (e.g. `from_supervisor` in the
 * Supervisor's own diagram). Owner-based membership makes a same-lane flow never a
 * crossing, so no `from_<self>` (or `to_<self>` for an in-lane end event) is emitted.
 * A flow node owned by ANOTHER lane (incl. that lane's start event) is still
 * external, so a genuine cross-lane `from_<OtherLane>` is unaffected.
 */
function isInLaneNode(bpmn: UMLModel, laneId: string, nodeId: string): boolean {
  const el = bpmn.elements[nodeId] as (UMLElement & { owner?: string }) | undefined;
  return !!el && el.owner === laneId;
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
 * 45 — the external endpoint's owning agentic *lane* element (a BPMNSwimlane),
 * walking the full owner chain like externalName. Returns undefined when the
 * endpoint resolves to a pool / start event / unlinked node — those are NOT
 * agentic peers (DQ-3 → cold-start for inbound). The agentic check is the
 * caller's (resolveEdgeKind already returns 'delegates' for non-agentic, but we
 * gate inbound on isAgentic so a human/external lane stays a cold-start).
 */
function externalLaneElement(
  bpmn: UMLModel,
  nodeId: string,
): (UMLElement & { isAgentic?: boolean; role?: unknown; agentDiagramRef?: string }) | undefined {
  const el = bpmn.elements[nodeId] as (UMLElement & { owner?: string }) | undefined;
  if (!el) return undefined;
  if (el.type === 'BPMNSwimlane') return el as never;
  const guard = new Set<string>();
  let cur = el.owner ? (bpmn.elements[el.owner] as (UMLElement & { owner?: string }) | undefined) : undefined;
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    if (cur.type === 'BPMNSwimlane') return cur as never;
    cur = cur.owner ? (bpmn.elements[cur.owner] as (UMLElement & { owner?: string }) | undefined) : undefined;
  }
  return undefined;
}

/**
 * 45 — synthetic visible intent name (DQ-2): `recv_<peer>_<task>` so a peer
 * feeding two different task-states yields two unambiguous intents.
 * Sanitized to BAF's identifier charset.
 */
function recvIntentName(peerName: string, taskName: string): string {
  return sanitizeStateName('recv_' + peerName + '_' + taskName);
}

/** 45 — the WME→BESSER A2A wire tag (memo § 3). Empty fields are omitted. */
function a2aTag(parts: {
  dir: 'in' | 'out';
  peer: string;
  ref?: string;
  flow: string;
  order?: number;
  kind?: AgenticEdgeKind;
}): string {
  const seg = [`a2a:${parts.dir}`, `peer=${parts.peer}`, `ref=${parts.ref ?? ''}`, `flow=${parts.flow}`];
  if (parts.dir === 'out') seg.push(`order=${parts.order ?? 1}`);
  if (parts.kind) seg.push(`kind=${parts.kind}`);
  return seg.join(';');
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

// ── 39 (4c): reflection scaffolds ───────────────────────────────────

/**
 * 39 — a self-loop transition on `stateId` (source === target). `emitTransition`
 * can't draw a loop — its two-point path would collapse to a line over the
 * element — so this routes a small loop out the right edge and back. Generic
 * `when_intent_matched` (no `predefinedType`) → the user names the intent (e.g.
 * "revise"). `isManuallyLayouted: true` so the loop path is preserved on first
 * open.
 */
function emitSelfLoop(out: UMLModel, stateId: string): void {
  const id = newId();
  const b = (out.elements[stateId] as unknown as { bounds: Bounds }).bounds;
  // Exit from the BOTTOM center and re-enter at the RIGHT center, tracing an
  // L-shape below-then-right of the state. Using asymmetric source/target
  // directions means the path clears the agent-robot icon at the top-right
  // corner and is immediately draggable.
  const bottom = b.y + b.height;
  const right = b.x + b.width;
  const midX = b.x + b.width / 2;
  const midY = b.y + b.height / 2;
  const loop = 30;
  const path = [
    { x: midX, y: bottom }, // exit bottom-center
    { x: midX, y: bottom + loop }, // go down
    { x: right + loop, y: bottom + loop }, // go right past the edge
    { x: right + loop, y: midY }, // go up to mid-height
    { x: right, y: midY }, // arrive at right-center
  ];
  out.relationships[id] = {
    id,
    name: '',
    type: 'AgentStateTransition',
    owner: null,
    bounds: { x: midX, y: midY, width: b.width / 2 + loop, height: b.height / 2 + loop },
    path,
    source: { element: stateId, direction: 'Down' },
    target: { element: stateId, direction: 'Right' },
    isManuallyLayouted: true,
  } as unknown as UMLRelationship;
}

/**
 * 39 (4c) — activate the SEAA'25 `reflectionMode` field (kept a no-op in the
 * rationalization, T1g) as a live consumer of the lane→Agent derivation. For each
 * task with `reflectionMode !== 'none'`, splice reflection states AFTER the task's
 * state, re-routing the task's forward transition(s) through them:
 *
 *  - 'self'  → a `<task>_reflect` self-evaluation state. task → reflect
 *             (when_no_intent_matched), a self-loop on reflect ("revise"), and
 *             reflect → next ("approve"). User adds the LLM body + intent names.
 *  - 'cross' → 45: a neutral `<task>_await_review` wait state (no stereotype),
 *             wired task → await_review → next. Proper A2A-ification (an a2a:in
 *             intent + tag, like appendCrossLaneIO) is deferred to follow-up
 *             guide 46-reflection-scaffold-a2a-cleanup.
 *  - 'human' → a `<task>_human_review` wait state. task → human_review
 *             (when_no_intent_matched), human_review → next ("approved"), and
 *             human_review → task ("rejected", loops back for revision).
 *
 * Re-route = delete the task's existing forward edges to OTHER task-states and
 * re-emit them off the reflection exit (no double path). Boundary edges (target
 * not a task-state) and the task's incoming edges are left intact. Reflection
 * states are synthetic → no `elementMapping` entry (matches guide 30).
 */
function appendReflectionScaffolds(out: UMLModel, tasks: AnyEl[], stateIdByTask: Map<string, string>): void {
  const taskStateIds = new Set(stateIdByTask.values());
  for (const t of tasks) {
    const mode = t.reflectionMode ?? 'none';
    if (mode === 'none') continue;
    const sT = stateIdByTask.get(t.id);
    if (!sT) continue;
    const taskName = sanitizeStateName(t.name || 'Task');
    const sb = (out.elements[sT] as unknown as { bounds: Bounds }).bounds;

    // Capture + remove the task-state's forward transitions to OTHER task-states
    // (re-routed through the reflection states below). Object.entries snapshots,
    // so deleting during the loop is safe. Boundary/self edges are skipped.
    const nexts: string[] = [];
    for (const [rid, rel] of Object.entries(out.relationships)) {
      const r = rel as unknown as UMLRelationship;
      if (r.type !== 'AgentStateTransition') continue;
      if (r.source.element !== sT || r.target.element === sT) continue;
      if (!taskStateIds.has(r.target.element)) continue;
      nexts.push(r.target.element);
      delete out.relationships[rid];
    }

    if (mode === 'self') {
      const reflectId = newId();
      out.elements[reflectId] = {
        id: reflectId,
        name: `${taskName}_reflect`,
        type: 'AgentState',
        owner: null,
        bounds: { x: REFLECT_COL_X, y: sb.y, width: STATE_W, height: STATE_H },
        bodies: [],
        fallbackBodies: [],
      } as unknown as UMLElement;
      emitTransition(out, sT, reflectId, 'AgentStateTransition', 'horizontal', 'when_no_intent_matched');
      emitSelfLoop(out, reflectId); // generic intent — user names it "revise"
      for (const n of nexts) emitTransition(out, reflectId, n, 'AgentStateTransition', 'vertical'); // generic — "approve"
    } else if (mode === 'human') {
      const humanId = newId();
      out.elements[humanId] = {
        id: humanId,
        name: `${taskName}_human_review`,
        type: 'AgentState',
        owner: null,
        bounds: { x: REFLECT_COL_X, y: sb.y, width: STATE_W, height: STATE_H },
        bodies: [],
        fallbackBodies: [],
      } as unknown as UMLElement;
      emitTransition(out, sT, humanId, 'AgentStateTransition', 'horizontal', 'when_no_intent_matched');
      for (const n of nexts) emitTransition(out, humanId, n, 'AgentStateTransition', 'vertical'); // generic — "approved"
      emitTransition(out, humanId, sT, 'AgentStateTransition', 'horizontal'); // generic — "rejected" loop back
    } else if (mode === 'cross') {
      // 45 — interim: a neutral wait state (no «input» stereotype, no from_/to_
      // name) so cross-reflection no longer emits a boundary state. Proper
      // A2A-ification (an a2a:in intent + tag, like appendCrossLaneIO) is deferred
      // to follow-up guide 46-reflection-scaffold-a2a-cleanup.
      const reviewId = newId();
      out.elements[reviewId] = {
        id: reviewId,
        name: `${taskName}_await_review`,
        type: 'AgentState',
        owner: null,
        bounds: { x: REFLECT_COL_X, y: sb.y, width: STATE_W, height: STATE_H },
        bodies: [],
        fallbackBodies: [],
      } as unknown as UMLElement;
      emitTransition(out, sT, reviewId, 'AgentStateTransition', 'horizontal', 'when_no_intent_matched');
      for (const n of nexts) emitTransition(out, reviewId, n, 'AgentStateTransition', 'vertical');
    }
  }
}
