import type { UMLModel, UMLElement, UMLRelationship } from '@besser/wme';
import { UMLDiagramType } from '@besser/wme';
import type { ElementLineageMap } from '../../shared/types/project';
import type { DerivationResult, DerivationWarning } from './types';

type LaneCrossingFlow = {
  flowId: string;
  srcLaneId: string;
  tgtLaneId: string;
  // Gateway-as-lane-proxy (guide 13 § 5.1 / Q1): the gateway that
  // mediates this edge, if either endpoint was a gateway. Consumed by
  // resolveEdgeKind (Q4) to detect a role-cooperation merge → supervises.
  gatewayId?: string;
};

type AgenticEdgeKind = 'delegates' | 'supervises' | 'revises' | 'collaborates';

export type DerivationOpts = {
  /** id → model for every AgentDiagram in the project (DQ4). Omitted →
   *  capability traversal is skipped entirely (back-compatible). */
  agentDiagramsById?: Map<string, UMLModel>;
  /** DQ1 — opt-in. When false/undefined, no tool/skill Components are
   *  emitted and the output is byte-for-byte the pre-16 derivation. When
   *  true, each agent's tools/skills are pooled into shared "Skills"/
   *  "Tools" Subsystems (16-FU2), deduped globally by name, with one
   *  has/uses edge per (agent, capability). */
  includeCapabilities?: boolean;
};

export function bpmnModelToComponentModel(bpmn: UMLModel, opts?: DerivationOpts): DerivationResult {
  const warnings: DerivationWarning[] = [];

  if (bpmn.type !== UMLDiagramType.BPMN) {
    return { ok: false, reason: 'not-a-bpmn-diagram', warnings };
  }

  const pools = collectPools(bpmn);
  if (pools.length === 0) {
    return { ok: false, reason: 'no-pools', warnings };
  }

  const lanesByPool = collectLanesByPool(bpmn, pools);
  const hasAnyLane = Array.from(lanesByPool.values()).some((ls) => ls.length > 0);
  if (!hasAnyLane) {
    return { ok: false, reason: 'no-lanes-in-any-pool', warnings };
  }

  const out = emptyComponentModel(bpmn.size);
  const layout = makeLayoutCursor();
  // 06-v2 — derivedElementId → source BPMN element id. Synthetic
  // external Components leave no entry.
  const elementMapping: ElementLineageMap = {};

  // Phase 1: Subsystems + lane-Components
  // F-D1 (2026-05-27): tasks are not represented in the Component
  // diagram. Only lane-to-lane swarm structure matters.
  const componentIdByLaneId = new Map<string, string>();
  // 14-FU2: Subsystem id per pool, so a message flow that lands on the
  // pool-as-whole resolves to the Subsystem (the swarm boundary) rather
  // than an inner lane Component.
  const subsystemIdByPoolId = new Map<string, string>();
  // 16-FU2 — grouped mode defers capability emission: Phase 1 fills this,
  // Phase 1.5 drains it. Stays empty in per-agent mode. `capabilitiesTopY`
  // captures the first Subsystem's y NOW (before the cursor advances) so
  // the grouped zones can top-align with the swarm.
  const collectedCaps: CollectedCapability[] = [];
  const capabilitiesTopY = layout.subsystemY;
  for (const pool of pools) {
    const lanes = lanesByPool.get(pool.id) ?? [];
    if (lanes.length === 0) continue;

    const subsystemId = emitSubsystem(out, pool, layout);
    elementMapping[subsystemId] = pool.id; // 06-v2 — Subsystem ← source Pool
    subsystemIdByPoolId.set(pool.id, subsystemId); // 14-FU2
    for (const lane of lanes) {
      const laneCompId = emitLaneComponent(out, lane, subsystemId, layout);
      componentIdByLaneId.set(lane.id, laneCompId);
      elementMapping[laneCompId] = lane.id; // 06-v2 — Component ← source Lane

      const isAgentic = (lane as unknown as { isAgentic?: boolean }).isAgentic === true;
      if (!isAgentic) {
        for (const t of tasksInLane(bpmn, lane.id)) {
          warnings.push({ kind: 'dropped-task-in-non-agentic-lane', taskId: t.id });
        }
      } else if (opts?.includeCapabilities && opts.agentDiagramsById) {
        // 16 + 16-FU2 (DQ1/DQ4): an agentic lane = one agent. Collect its
        // tasks' linked Agent-diagram tools/skills so Phase 1.5 can pool
        // them into shared Skills/Tools Subsystems (the sole capability
        // layout; per-agent columns retired 2026-06-05).
        collectLaneCapabilities(bpmn, lane, laneCompId, opts.agentDiagramsById, collectedCaps, warnings);
      }
    }
    layout.endSubsystem();
  }

  // Phase 1.5 (16-FU2): grouped-capability layout — pool every agent's
  // collected tools/skills into shared "Skills"/"Tools" Subsystems
  // (global dedup by name, D1), placed to the right of the swarm.
  if (opts?.includeCapabilities) {
    emitGroupedCapabilities(out, collectedCaps, layout, elementMapping, capabilitiesTopY, warnings);
  }

  // Phase 2: lane-crossing sequence flows → ComponentDependency
  const laneCrossings = collectLaneCrossingFlows(bpmn, lanesByPool);
  const dedup = new EdgeDedup();
  for (const crossing of laneCrossings) {
    const srcLane = bpmn.elements[crossing.srcLaneId];
    const tgtLane = bpmn.elements[crossing.tgtLaneId];
    const gateway = crossing.gatewayId ? bpmn.elements[crossing.gatewayId] : undefined;

    if (!srcLane || !tgtLane) continue;
    const kind = resolveEdgeKind(srcLane, tgtLane, gateway);

    const srcComp = componentIdByLaneId.get(crossing.srcLaneId);
    const tgtComp = componentIdByLaneId.get(crossing.tgtLaneId);
    if (!srcComp || !tgtComp) continue;
    dedup.add(srcComp, tgtComp, kind, crossing.flowId);
  }
  for (const e of dedup.entries()) {
    const edgeId = emitComponentDependency(out, e.srcCompId, e.tgtCompId, e.kind);
    elementMapping[edgeId] = e.sourceFlowId; // 06-v2 — ComponentDependency ← source BPMNFlow
  }

  // Phase 3: inter-pool message flows → ComponentDependency
  // 14-FU2: an endpoint that lands on a specific lane → that lane's
  // Component; an endpoint on the pool-as-whole (header / black-box
  // participant, BPMN 2.0.2 § 9.2.1, or a shape in a laneless pool) →
  // that pool's Subsystem (the swarm boundary, plan § 3). A black-box
  // pool with no lanes gets a synthesised external Subsystem, once.
  const resolveMessageEndpoint = (elementId: string): string | undefined => {
    const lane = laneForElement(bpmn, elementId);
    if (lane) return componentIdByLaneId.get(lane.id);
    const el = bpmn.elements[elementId];
    const poolId = el ? poolFor(bpmn, el) : null;
    if (!poolId) return undefined;
    const existing = subsystemIdByPoolId.get(poolId);
    if (existing) return existing;
    const pool = bpmn.elements[poolId];
    if (!pool) return undefined;
    const subId = emitExternalSubsystem(out, pool, layout);
    subsystemIdByPoolId.set(poolId, subId); // dedupe further flows to this pool
    elementMapping[subId] = poolId; // Subsystem ← source Pool (a real element)
    return subId;
  };

  const messageFlows = collectInterPoolMessageFlows(bpmn);
  for (const mf of messageFlows) {
    const srcTarget = resolveMessageEndpoint(mf.source.element);
    if (!srcTarget) continue;
    const tgtTarget = resolveMessageEndpoint(mf.target.element);
    if (!tgtTarget) continue;
    const edgeId = emitComponentDependency(out, srcTarget, tgtTarget, 'delegates');
    elementMapping[edgeId] = mf.id; // 06-v2 — ComponentDependency ← source BPMNFlow (message)
  }

  // 16-FU3-FU2 — grouped zones break the origin-centered layout; re-center so
  // the diagram opens on-screen. Gated: plain output stays byte-for-byte.
  if (opts?.includeCapabilities && collectedCaps.length > 0) {
    recenterModelOnOrigin(out);
  }

  return { ok: true, model: out, warnings, elementMapping };
}

// ── Collection helpers ──────────────────────────────────────────────

function collectPools(bpmn: UMLModel): UMLElement[] {
  return Object.values(bpmn.elements).filter((e) => e.type === 'BPMNPool');
}

function collectLanesByPool(bpmn: UMLModel, pools: UMLElement[]): Map<string, UMLElement[]> {
  const out = new Map<string, UMLElement[]>();
  const poolIds = new Set(pools.map((p) => p.id));
  for (const el of Object.values(bpmn.elements)) {
    if (el.type !== 'BPMNSwimlane') continue;
    if (!el.owner || !poolIds.has(el.owner)) continue;
    const arr = out.get(el.owner) ?? [];
    arr.push(el);
    out.set(el.owner, arr);
  }
  for (const arr of out.values()) {
    arr.sort((a, b) => a.bounds.y - b.bounds.y);
  }
  return out;
}

function tasksInLane(bpmn: UMLModel, laneId: string): UMLElement[] {
  return Object.values(bpmn.elements).filter((e) => e.type === 'BPMNTask' && e.owner === laneId);
}

function laneForElement(bpmn: UMLModel, elementId: string): UMLElement | null {
  const el = bpmn.elements[elementId];
  if (!el) return null;
  // F-D4 (2026-05-27): if the element IS a lane (e.g. a message flow
  // drawn directly to the lane shape), return it.
  if (el.type === 'BPMNSwimlane') return el;
  const parent = el.owner ? bpmn.elements[el.owner] : null;
  if (parent && parent.type === 'BPMNSwimlane') return parent;
  return null;
}

// Resolve a sequence-flow endpoint to the tracked lane that "owns" it
// (guide 13 § 5.1 / Q1 — gateway-as-lane-proxy). A task resolves to its
// lane; a gateway resolves to the lane that owns it, so a flow into or
// out of a gateway is attributed to the gateway's OWN lane rather than
// routed through to a downstream task. Returns null for endpoints that
// don't resolve to a tracked lane (events, free-floating shapes, or a
// gateway owned by a pool) — those are not lane bridges in v1, matching
// the prior scope (events were never traced).
function laneIdForEndpoint(
  bpmn: UMLModel,
  elementId: string,
  trackedLanes: Set<string>,
): { laneId: string; gatewayId?: string } | null {
  const el = bpmn.elements[elementId];
  if (!el) return null;
  if (el.type === 'BPMNTask') {
    const laneId = el.owner;
    return laneId && trackedLanes.has(laneId) ? { laneId } : null;
  }
  if (el.type === 'BPMNGateway') {
    const laneId = el.owner;
    return laneId && trackedLanes.has(laneId) ? { laneId, gatewayId: el.id } : null;
  }
  return null;
}

function collectLaneCrossingFlows(bpmn: UMLModel, lanesByPool: Map<string, UMLElement[]>): LaneCrossingFlow[] {
  const trackedLanes = new Set<string>();
  for (const arr of lanesByPool.values()) for (const l of arr) trackedLanes.add(l.id);

  const sequenceFlows = Object.values(bpmn.relationships).filter(
    (r) => r.type === 'BPMNFlow' && (r as unknown as { flowType?: string }).flowType === 'sequence',
  );

  const out: LaneCrossingFlow[] = [];
  for (const f of sequenceFlows) {
    const src = laneIdForEndpoint(bpmn, f.source.element, trackedLanes);
    const tgt = laneIdForEndpoint(bpmn, f.target.element, trackedLanes);
    if (!src || !tgt) continue; // an endpoint isn't a tracked task/gateway
    if (src.laneId === tgt.laneId) continue; // intra-lane — process detail

    out.push({
      flowId: f.id,
      srcLaneId: src.laneId,
      tgtLaneId: tgt.laneId,
      // The gateway endpoint (if any) mediates the edge. When BOTH ends
      // are gateways (gateway→gateway chain), the source side wins — the
      // chain still resolves to the correct cross-lane edge per hop, so
      // the old `multi-hop-gateway` warning is no longer needed.
      gatewayId: src.gatewayId ?? tgt.gatewayId,
    });
  }
  return out;
}

function collectInterPoolMessageFlows(bpmn: UMLModel): UMLRelationship[] {
  return Object.values(bpmn.relationships).filter((r) => {
    if (r.type !== 'BPMNFlow') return false;
    if ((r as unknown as { flowType?: string }).flowType !== 'message') return false;
    const src = bpmn.elements[r.source.element];
    const tgt = bpmn.elements[r.target.element];
    if (!src || !tgt) return false;
    const srcPool = poolFor(bpmn, src);
    const tgtPool = poolFor(bpmn, tgt);
    return Boolean(srcPool && tgtPool && srcPool !== tgtPool);
  });
}

function poolFor(bpmn: UMLModel, el: UMLElement): string | null {
  // 02-FU3 (2026-05-27): when the element IS a pool (e.g. a message
  // flow drawn to the pool shape itself, treating the pool as a
  // black-box participant per BPMN 2.0.2 § 9.2.1), return its id
  // instead of walking up to a non-existent parent.
  if (el.type === 'BPMNPool') return el.id;
  let cur: UMLElement | null = el;
  while (cur && cur.owner) {
    const parent: UMLElement | undefined = bpmn.elements[cur.owner];
    if (!parent) return null;
    if (parent.type === 'BPMNPool') return parent.id;
    cur = parent;
  }
  return null;
}

// ── Edge-kind heuristic (OQ-5, guide § 2) ───────────────────────────

function resolveEdgeKind(srcLane: UMLElement, tgtLane: UMLElement, gateway: UMLElement | undefined): AgenticEdgeKind {
  const srcAgentic = (srcLane as unknown as { isAgentic?: boolean }).isAgentic === true;
  const tgtAgentic = (tgtLane as unknown as { isAgentic?: boolean }).isAgentic === true;

  // Role enum is meaningless on a human / external lane → plain delegation.
  if (!srcAgentic || !tgtAgentic) return 'delegates';

  const srcRole = (srcLane as unknown as { role?: 'manager' | 'worker' }).role;
  const tgtRole = (tgtLane as unknown as { role?: 'manager' | 'worker' }).role;

  // Producer → reviewer (worker returns output up to the manager).
  if (srcRole === 'worker' && tgtRole === 'manager') return 'revises';
  // Peers, no authority asymmetry.
  if (srcRole === tgtRole) return 'collaborates';

  if (srcRole === 'manager' && tgtRole === 'worker') {
    // Guide 13 § 5.2 (Q2) + 14-FU1 (FF2). A manager→worker handoff whose
    // mediating AGENTIC gateway runs a role-cooperation merge is
    // SUPERVISION: the manager drives/approves the merge → authority /
    // oversight. We check whichever agentic gateway mediates the edge,
    // REGARDLESS of its gatewayRole — in a natural diverge-then-merge the
    // manager→worker edge is mediated by the DIVERGING gateway, whose
    // user-facing field is `collaborationMode` ('role'). The popup
    // auto-snaps `mergingStrategy` to leader-driven/composed
    // (changeCollaborationMode, bpmn-gateway-update.tsx), so we read the
    // mode first (intention-revealing, always populated) and fall back to
    // the strategy for a merging gateway or an imported/out-of-sync model.
    // A voting/majority merge stays plain delegation (workers self-decide).
    if (gateway && (gateway as unknown as { isAgentic?: boolean }).isAgentic === true) {
      const g = gateway as unknown as { mergingStrategy?: string; collaborationMode?: string };
      const roleCooperation =
        g.collaborationMode === 'role' || g.mergingStrategy === 'leader-driven' || g.mergingStrategy === 'composed';
      if (roleCooperation) return 'supervises';
    }
    return 'delegates';
  }

  return 'delegates';
}

// Guide 13 § 5.3 (Q3). In-pool non-agentic lanes are overwhelmingly
// human-in-the-loop participants (User, Maintainer), so default to
// `human`; promote to `external` only when the name reads as a system /
// service. Truly-external INTER-POOL participants get a hardcoded
// `external` via emitExternalComponent (Phase 3 synthetic path), so this
// default does not mislabel them. (A second pool's in-lane non-agentic
// actor reached by a message flow defaults `human` unless system-named —
// accepted edge case; user-editable from the popup.)
function nonAgenticStereotype(laneName: string | undefined): 'human' | 'external' {
  const name = (laneName ?? '').toLowerCase();
  return /(queue|api|service|system|database|db|broker|gateway)/.test(name) ? 'external' : 'human';
}

// ── Capability traversal (16, plan 15 §4–§5) ────────────────────────

// 16-FU2 — capability box geometry, used by emitGroupedCapabilities for the
// Skills/Tools zone sizing and the stacked-component layout inside them.
const CAP_W = 140; // capability Component width
const CAP_H = 70; // capability Component height
const CAP_GAP = 16; // vertical gap between stacked capabilities

// 16-FU3 (P2, D2) — an agentic lane wired to MORE than this many distinct
// capabilities (tools + skills, deduped) trips a `capability-heavy-agent`
// advisory: its has/uses edges fan out and the grouped diagram reads busy.
// Warn-only (D1) — nothing is truncated.
const CAPABILITY_WARN_THRESHOLD = 10;

// 16-FU3 (per-zone) — a grouped Skills/Tools zone holding MORE than this
// many unique boxes trips a `capability-heavy-zone` advisory: the zone is
// crowded even when no single agent crosses the per-agent threshold (the
// "several moderate agents" case from manual testing). Warn-only.
const CAPABILITY_ZONE_WARN_THRESHOLD = 12;

// Agent-diagram element type → Component stereotype. `agentic.py` Skill /
// Tool (CAPABILITY_TOKENS). Drop the AgentSkill row for tools-only.
const CAPABILITY_STEREOTYPE: Record<string, 'tool' | 'skill'> = {
  AgentTool: 'tool',
  AgentSkill: 'skill',
};

// agent → capability edge kind, locked by agentic.py AgenticEdgeKind:
// USES → Tool, HAS → Skill (DQ3).
const CAPABILITY_EDGE: Record<'tool' | 'skill', 'uses' | 'has'> = {
  tool: 'uses',
  skill: 'has',
};

function capabilityElements(agentModel: UMLModel): UMLElement[] {
  return Object.values(agentModel.elements).filter((e) => CAPABILITY_STEREOTYPE[e.type] !== undefined);
}

// 16-FU2 — one agent's reference to a capability, gathered in Phase 1 and
// drained by emitGroupedCapabilities. `agentCompId` is the lane Component
// that has/uses it; `taskId` is the linking BPMNTask (lineage, DQ7/D4).
type CollectedCapability = {
  agentCompId: string;
  stereo: 'tool' | 'skill';
  name: string;
  taskId: string;
};

// 16-FU2 (D2): one agentic lane's capabilities — union over its tasks'
// linked Agent diagrams (DQ6 = task.agentDiagramRef), deduped per agent by
// stereotype+name (DQ5). Pushes descriptors for Phase 1.5 instead of
// emitting (zone box height needs the global count). A dangling ref
// (deleted Agent diagram) is skipped silently — the popup already surfaces
// dangling refs (guide 08/11).
// 16-FU3 (P2, D2/D4): `seen.size` after the walk is the agent's deduped
// capability total — which is exactly its has/uses edge count into the
// zones. If it exceeds CAPABILITY_WARN_THRESHOLD, push an advisory
// `capability-heavy-agent` warning (nothing is dropped — D1).
function collectLaneCapabilities(
  bpmn: UMLModel,
  lane: UMLElement,
  agentCompId: string,
  agentDiagramsById: Map<string, UMLModel>,
  out: CollectedCapability[],
  warnings: DerivationWarning[],
): void {
  const seen = new Set<string>();
  for (const task of tasksInLane(bpmn, lane.id)) {
    const ref = (task as unknown as { agentDiagramRef?: string }).agentDiagramRef;
    if (!ref) continue;
    const agentModel = agentDiagramsById.get(ref);
    if (!agentModel) continue; // dangling ref → skip
    for (const cap of capabilityElements(agentModel)) {
      const stereo = CAPABILITY_STEREOTYPE[cap.type];
      const name = (cap.name ?? '').trim();
      if (!name) continue;
      const key = `${stereo}::${name.toLowerCase()}`;
      if (seen.has(key)) continue; // per-agent dedup (DQ5)
      seen.add(key);
      out.push({ agentCompId, stereo, name, taskId: task.id });
    }
  }
  if (seen.size > CAPABILITY_WARN_THRESHOLD) {
    warnings.push({ kind: 'capability-heavy-agent', laneId: lane.id, count: seen.size });
  }
}

// 16-FU2 — grouped-capability layout. Pool every collected capability into
// up to two shared Subsystems ("Skills" / "Tools"), deduped GLOBALLY by
// name within its kind (D1), then draw one edge per (agent, capability).
// Mirrors the worked example (unp-component.drawio): agents on the left,
// capability zones on the right, has/uses edges crossing in.
function emitGroupedCapabilities(
  out: UMLModel,
  collected: CollectedCapability[],
  layout: LayoutCursor,
  elementMapping: ElementLineageMap,
  topY: number,
  warnings: DerivationWarning[],
): void {
  if (collected.length === 0) return;

  // Ordered unique names per kind + the first task that contributed each
  // (first-wins lineage, D4 — mirrors EdgeDedup's representative rule).
  const uniqueByKind: Record<'tool' | 'skill', Array<{ name: string; taskId: string }>> = { tool: [], skill: [] };
  for (const c of collected) {
    const list = uniqueByKind[c.stereo];
    if (list.some((u) => u.name.toLowerCase() === c.name.toLowerCase())) continue;
    list.push({ name: c.name, taskId: c.taskId });
  }

  // Geometry: zones to the RIGHT of the fixed-width pool column (D3),
  // top-aligned with the first Subsystem.
  const PAD = 20;
  const HEADER = 40;
  const boxW = CAP_W + 2 * PAD;
  let boxX = layout.subsystemX + 640 + 80; // clears the 640-wide pool column

  const capIdByKey = new Map<string, string>();
  const emitZone = (stereo: 'tool' | 'skill', title: string): void => {
    const list = uniqueByKind[stereo];
    if (list.length === 0) return; // tools-only diagrams show just the Tools zone
    if (list.length > CAPABILITY_ZONE_WARN_THRESHOLD) {
      warnings.push({ kind: 'capability-heavy-zone', zone: title, count: list.length });
    }
    const boxH = HEADER + list.length * (CAP_H + CAP_GAP) - CAP_GAP + PAD;
    const zoneId = newId();
    out.elements[zoneId] = {
      id: zoneId,
      name: title,
      type: 'Subsystem',
      owner: null,
      bounds: { x: boxX, y: topY, width: boxW, height: boxH },
      stereotype: 'subsystem',
      displayStereotype: true,
    } as unknown as UMLElement;
    list.forEach((entry, i) => {
      const capId = newId();
      out.elements[capId] = {
        id: capId,
        name: entry.name,
        type: 'Component',
        owner: zoneId,
        bounds: { x: boxX + PAD, y: topY + HEADER + i * (CAP_H + CAP_GAP), width: CAP_W, height: CAP_H },
        stereotype: stereo,
        displayStereotype: true,
      } as unknown as UMLElement;
      capIdByKey.set(`${stereo}::${entry.name.toLowerCase()}`, capId);
      elementMapping[capId] = entry.taskId; // D4 — first-wins
    });
    boxX += boxW + 40;
  };
  emitZone('skill', 'Skills');
  emitZone('tool', 'Tools');

  // One edge per (agent, capability). `collected` is already per-agent
  // deduped, so (agentCompId, capId) pairs are unique — no extra dedup.
  for (const c of collected) {
    const capId = capIdByKey.get(`${c.stereo}::${c.name.toLowerCase()}`);
    if (!capId) continue;
    const edgeId = emitComponentDependency(out, c.agentCompId, capId, CAPABILITY_EDGE[c.stereo]);
    elementMapping[edgeId] = c.taskId;
  }
}

// ── Emit helpers ────────────────────────────────────────────────────

function emptyComponentModel(size: { width: number; height: number }): UMLModel {
  return {
    version: '3.0.0',
    type: UMLDiagramType.ComponentDiagram,
    size,
    elements: {},
    interactive: { elements: {}, relationships: {} },
    relationships: {},
    assessments: {},
  };
}

interface LayoutCursor {
  subsystemX: number;
  subsystemY: number;
  laneInSubsystemX: number;
  skillRightOfLaneY: number;
  externalRowY: number;
  externalX: number;
  currentSubsystemBounds: { x: number; y: number; width: number; height: number } | null;
  endSubsystem(): void;
}

// F-D5 (2026-05-27): canvas origin is (0, 0); putting the first
// Subsystem at (-320, -200) centers a 640x400 Subsystem on the
// viewport. Subsequent Subsystems stack below.
function makeLayoutCursor(): LayoutCursor {
  return {
    subsystemX: -320,
    subsystemY: -200,
    laneInSubsystemX: 0,
    skillRightOfLaneY: 0,
    externalRowY: 0,
    externalX: -320,
    currentSubsystemBounds: null,
    endSubsystem(this: LayoutCursor) {
      if (this.currentSubsystemBounds) {
        this.subsystemY = this.currentSubsystemBounds.y + this.currentSubsystemBounds.height + 40;
        this.externalRowY = this.subsystemY;
      }
      this.currentSubsystemBounds = null;
    },
  };
}

const newId = (): string => 'gen-' + Math.random().toString(36).slice(2, 11);

function emitSubsystem(out: UMLModel, pool: UMLElement, layout: LayoutCursor): string {
  const id = newId();
  const bounds = { x: layout.subsystemX, y: layout.subsystemY, width: 640, height: 400 };
  layout.currentSubsystemBounds = bounds;
  layout.laneInSubsystemX = bounds.x + 24;
  layout.skillRightOfLaneY = bounds.y + 40;
  out.elements[id] = {
    id,
    name: pool.name || 'Swarm',
    type: 'Subsystem',
    owner: null,
    bounds,
    stereotype: 'subsystem',
    displayStereotype: true,
  } as unknown as UMLElement;
  return id;
}

function emitLaneComponent(out: UMLModel, lane: UMLElement, subsystemId: string, layout: LayoutCursor): string {
  const id = newId();
  const isAgentic = (lane as unknown as { isAgentic?: boolean }).isAgentic === true;
  const stereotype = isAgentic ? 'solution' : nonAgenticStereotype(lane.name);
  const bounds = {
    x: layout.laneInSubsystemX,
    y: (layout.currentSubsystemBounds?.y ?? 0) + 40,
    width: 160,
    height: 80,
  };
  layout.laneInSubsystemX += bounds.width + 24;
  out.elements[id] = {
    id,
    name: lane.name || (isAgentic ? 'Agent' : 'Actor'),
    type: 'Component',
    owner: subsystemId,
    bounds,
    stereotype,
    displayStereotype: true,
  } as unknown as UMLElement;
  return id;
}

// 14-FU2: a black-box external pool (no lanes) is still a swarm boundary
// → a Subsystem, not a Component. Placed in the external row below the
// tracked Subsystems. Named after the source pool.
function emitExternalSubsystem(out: UMLModel, pool: UMLElement, layout: LayoutCursor): string {
  const id = newId();
  const bounds = { x: layout.externalX, y: layout.externalRowY, width: 320, height: 160 };
  layout.externalX += bounds.width + 24;
  out.elements[id] = {
    id,
    name: pool.name || 'External swarm',
    type: 'Subsystem',
    owner: null,
    bounds,
    stereotype: 'subsystem',
    displayStereotype: true,
  } as unknown as UMLElement;
  return id;
}

function emitComponentDependency(out: UMLModel, sourceId: string, targetId: string, stereotype: string): string {
  const id = newId();
  const src = (out.elements[sourceId] as unknown as { bounds: { x: number; y: number; width: number; height: number } })
    .bounds;
  const tgt = (out.elements[targetId] as unknown as { bounds: { x: number; y: number; width: number; height: number } })
    .bounds;
  out.relationships[id] = {
    id,
    name: '',
    type: 'ComponentDependency',
    owner: null,
    bounds: {
      x: Math.min(src.x, tgt.x),
      y: Math.min(src.y, tgt.y),
      width: Math.abs(src.x - tgt.x) + Math.max(src.width, tgt.width),
      height: Math.abs(src.y - tgt.y) + Math.max(src.height, tgt.height),
    },
    path: [
      { x: src.x + src.width / 2, y: src.y + src.height / 2 },
      { x: tgt.x + tgt.width / 2, y: tgt.y + tgt.height / 2 },
    ],
    source: { element: sourceId, direction: 'Right' },
    target: { element: targetId, direction: 'Left' },
    stereotype,
  } as unknown as UMLRelationship;
  return id;
}

// 16-FU3-FU2 (scroll fix): the editor sizes the canvas symmetrically around
// the origin (uml-diagram.ts) and the scroll container opens at top-left, so
// emitted content must straddle (0,0) or the diagram opens scrolled into empty
// space. A tall grouped Skills/Tools zone pushes the content bbox far below
// origin; translate the whole model so its bbox midpoint is (0,0), restoring
// the makeLayoutCursor design intent. Idempotent for already-centered content
// (single-pool swarm → dx=dy=0). Translates relationships (bounds + path) by
// the same delta so edges stay attached.
function recenterModelOnOrigin(out: UMLModel): void {
  const els = Object.values(out.elements);
  if (els.length === 0) return;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const e of els) {
    const b = (e as unknown as { bounds: { x: number; y: number; width: number; height: number } }).bounds;
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  const dx = -(minX + maxX) / 2;
  const dy = -(minY + maxY) / 2;
  if (dx === 0 && dy === 0) return;
  for (const e of els) {
    const b = (e as unknown as { bounds: { x: number; y: number } }).bounds;
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

// ── Edge de-duplication (guide § 1 D-D4) ────────────────────────────

class EdgeDedup {
  private seen = new Set<string>();
  private out: Array<{ srcCompId: string; tgtCompId: string; kind: AgenticEdgeKind; sourceFlowId: string }> = [];

  // 06-v2 — accepts a representative `sourceFlowId` for the lineage
  // map. When multiple flows collapse into one edge, the first
  // occurrence wins (the others are functionally identical).
  add(srcCompId: string, tgtCompId: string, kind: AgenticEdgeKind, sourceFlowId: string): void {
    const k = `${srcCompId}::${tgtCompId}::${kind}`;
    if (this.seen.has(k)) return;
    this.seen.add(k);
    this.out.push({ srcCompId, tgtCompId, kind, sourceFlowId });
  }

  entries(): Array<{ srcCompId: string; tgtCompId: string; kind: AgenticEdgeKind; sourceFlowId: string }> {
    return this.out;
  }
}
