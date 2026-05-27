import type { UMLModel, UMLElement, UMLRelationship } from '@besser/wme';
import { UMLDiagramType } from '@besser/wme';
import type { DerivationResult, DerivationWarning } from './types';

type LaneCrossingFlow = {
  flowId: string;
  srcTaskId: string;
  tgtTaskId: string;
  srcLaneId: string;
  tgtLaneId: string;
  viaGatewayId?: string;
};

type AgenticEdgeKind = 'delegates' | 'supervises' | 'revises' | 'collaborates';

export function bpmnModelToComponentModel(bpmn: UMLModel): DerivationResult {
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

  // Phase 1: Subsystems + lane-Components + skill-Components
  const componentIdByLaneId = new Map<string, string>();
  const skillIdsByLaneId = new Map<string, string[]>();
  for (const pool of pools) {
    const lanes = lanesByPool.get(pool.id) ?? [];
    if (lanes.length === 0) continue;

    const subsystemId = emitSubsystem(out, pool, layout);
    for (const lane of lanes) {
      const laneCompId = emitLaneComponent(out, lane, subsystemId, layout);
      componentIdByLaneId.set(lane.id, laneCompId);

      const isAgentic = (lane as unknown as { isAgentic?: boolean }).isAgentic === true;
      const skills = isAgentic ? emitSkillComponents(out, bpmn, lane, laneCompId, layout) : [];
      if (!isAgentic) {
        for (const t of tasksInLane(bpmn, lane.id)) {
          warnings.push({ kind: 'dropped-task-in-non-agentic-lane', taskId: t.id });
        }
      }
      skillIdsByLaneId.set(lane.id, skills);
    }
    layout.endSubsystem();
  }

  // Phase 2: lane-crossing sequence flows → ComponentDependency
  const laneCrossings = collectLaneCrossingFlows(bpmn, lanesByPool, warnings);
  const dedup = new EdgeDedup();
  for (const crossing of laneCrossings) {
    const srcLane = bpmn.elements[crossing.srcLaneId];
    const tgtLane = bpmn.elements[crossing.tgtLaneId];
    const srcTask = bpmn.elements[crossing.srcTaskId];
    const gateway = crossing.viaGatewayId ? bpmn.elements[crossing.viaGatewayId] : undefined;

    if (!srcLane || !tgtLane) continue;
    const kind = resolveEdgeKind(srcLane, tgtLane, srcTask, gateway);

    const srcComp = componentIdByLaneId.get(crossing.srcLaneId);
    const tgtComp = componentIdByLaneId.get(crossing.tgtLaneId);
    if (!srcComp || !tgtComp) continue;
    dedup.add(srcComp, tgtComp, kind);
  }
  for (const e of dedup.entries()) {
    emitComponentDependency(out, e.srcCompId, e.tgtCompId, e.kind);
  }

  // Phase 3: inter-pool message flows → external Component + delegates
  const messageFlows = collectInterPoolMessageFlows(bpmn);
  for (const mf of messageFlows) {
    const srcLane = laneForElement(bpmn, mf.source.element);
    if (!srcLane) continue;
    const srcComp = componentIdByLaneId.get(srcLane.id);
    if (!srcComp) continue;
    const externalId = emitExternalComponent(out, mf, layout);
    emitComponentDependency(out, srcComp, externalId, 'delegates');
    warnings.push({ kind: 'inferred-external-component', messageFlowId: mf.id });
  }

  // Phase 4: skill ownership edges (`has`)
  for (const [laneId, skills] of skillIdsByLaneId) {
    const ownerCompId = componentIdByLaneId.get(laneId);
    if (!ownerCompId) continue;
    for (const skillId of skills) {
      emitComponentDependency(out, ownerCompId, skillId, 'has');
    }
  }

  return { ok: true, model: out, warnings };
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
  const parent = el.owner ? bpmn.elements[el.owner] : null;
  if (parent && parent.type === 'BPMNSwimlane') return parent;
  return null;
}

function collectLaneCrossingFlows(
  bpmn: UMLModel,
  lanesByPool: Map<string, UMLElement[]>,
  warnings: DerivationWarning[],
): LaneCrossingFlow[] {
  const lanes = new Set<string>();
  for (const arr of lanesByPool.values()) for (const l of arr) lanes.add(l.id);

  const sequenceFlows = Object.values(bpmn.relationships).filter(
    (r) => r.type === 'BPMNFlow' && (r as unknown as { flowType?: string }).flowType === 'sequence',
  );

  const out: LaneCrossingFlow[] = [];
  for (const f of sequenceFlows) {
    const srcEl = bpmn.elements[f.source.element];
    const tgtEl = bpmn.elements[f.target.element];
    if (!srcEl || !tgtEl) continue;

    // Direct task → task
    if (srcEl.type === 'BPMNTask' && tgtEl.type === 'BPMNTask') {
      const srcLane = srcEl.owner;
      const tgtLane = tgtEl.owner;
      if (srcLane && tgtLane && srcLane !== tgtLane && lanes.has(srcLane) && lanes.has(tgtLane)) {
        out.push({
          flowId: f.id,
          srcTaskId: srcEl.id,
          tgtTaskId: tgtEl.id,
          srcLaneId: srcLane,
          tgtLaneId: tgtLane,
        });
      }
      continue;
    }

    // task → gateway (one-hop)
    if (srcEl.type === 'BPMNTask' && tgtEl.type === 'BPMNGateway') {
      const gw = tgtEl;
      const outFlows = Object.values(bpmn.relationships).filter(
        (r) =>
          r.type === 'BPMNFlow' &&
          (r as unknown as { flowType?: string }).flowType === 'sequence' &&
          r.source.element === gw.id,
      );
      for (const outFlow of outFlows) {
        const ofTgt = bpmn.elements[outFlow.target.element];
        if (!ofTgt || ofTgt.type !== 'BPMNTask') {
          if (ofTgt && ofTgt.type === 'BPMNGateway') {
            warnings.push({
              kind: 'multi-hop-gateway',
              sourceTaskId: srcEl.id,
              targetGatewayId: ofTgt.id,
            });
          }
          continue;
        }
        const srcLane = srcEl.owner;
        const tgtLane = ofTgt.owner;
        if (srcLane && tgtLane && srcLane !== tgtLane && lanes.has(srcLane) && lanes.has(tgtLane)) {
          out.push({
            flowId: f.id,
            srcTaskId: srcEl.id,
            tgtTaskId: ofTgt.id,
            srcLaneId: srcLane,
            tgtLaneId: tgtLane,
            viaGatewayId: gw.id,
          });
        }
      }
      continue;
    }
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

function resolveEdgeKind(
  srcLane: UMLElement,
  tgtLane: UMLElement,
  _srcTask: UMLElement | undefined,
  gateway: UMLElement | undefined,
): AgenticEdgeKind {
  const srcAgentic = (srcLane as unknown as { isAgentic?: boolean }).isAgentic === true;
  const tgtAgentic = (tgtLane as unknown as { isAgentic?: boolean }).isAgentic === true;

  if (!srcAgentic || !tgtAgentic) return 'delegates';

  const srcRole = (srcLane as unknown as { role?: 'manager' | 'worker' }).role;
  const tgtRole = (tgtLane as unknown as { role?: 'manager' | 'worker' }).role;

  if (srcRole === 'worker' && tgtRole === 'manager') return 'revises';
  if (srcRole === tgtRole) return 'collaborates';

  if (srcRole === 'manager' && tgtRole === 'worker') {
    if (gateway) {
      const role = (gateway as unknown as { gatewayRole?: string }).gatewayRole;
      const strat = (gateway as unknown as { mergingStrategy?: string }).mergingStrategy;
      if (role === 'merging' && (strat === 'leader-driven' || strat === 'composed')) {
        return 'supervises';
      }
    }
    return 'delegates';
  }

  return 'delegates';
}

function nonAgenticStereotype(laneName: string | undefined): 'human' | 'external' {
  const name = (laneName ?? '').toLowerCase();
  return /(human|person|user|operator|reviewer|customer|client|actor)/.test(name) ? 'human' : 'external';
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

function makeLayoutCursor(): LayoutCursor {
  return {
    subsystemX: 20,
    subsystemY: 20,
    laneInSubsystemX: 0,
    skillRightOfLaneY: 0,
    externalRowY: 0,
    externalX: 20,
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

function emitSkillComponents(
  out: UMLModel,
  bpmn: UMLModel,
  lane: UMLElement,
  ownerCompId: string,
  _layout: LayoutCursor,
): string[] {
  const tasks = tasksInLane(bpmn, lane.id);
  const ownerBounds = (
    out.elements[ownerCompId] as unknown as {
      bounds: { x: number; y: number; width: number; height: number };
      owner: string | null;
    }
  ).bounds;
  const ownerOwner = (out.elements[ownerCompId] as unknown as { owner: string | null }).owner;
  let y = ownerBounds.y + ownerBounds.height + 16;
  const ids: string[] = [];
  for (const task of tasks) {
    const id = newId();
    const bounds = { x: ownerBounds.x + 20, y, width: 120, height: 60 };
    y += bounds.height + 12;
    out.elements[id] = {
      id,
      name: task.name || 'Skill',
      type: 'Component',
      owner: ownerOwner ?? null,
      bounds,
      stereotype: 'skill',
      displayStereotype: true,
    } as unknown as UMLElement;
    ids.push(id);
  }
  return ids;
}

function emitExternalComponent(out: UMLModel, mf: UMLRelationship, layout: LayoutCursor): string {
  const id = newId();
  const bounds = { x: layout.externalX, y: layout.externalRowY, width: 140, height: 80 };
  layout.externalX += bounds.width + 24;
  out.elements[id] = {
    id,
    name: mf.name || 'External',
    type: 'Component',
    owner: null,
    bounds,
    stereotype: 'external',
    displayStereotype: true,
  } as unknown as UMLElement;
  return id;
}

function emitComponentDependency(out: UMLModel, sourceId: string, targetId: string, stereotype: string): void {
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
}

// ── Edge de-duplication (guide § 1 D-D4) ────────────────────────────

class EdgeDedup {
  private seen = new Set<string>();
  private out: Array<{ srcCompId: string; tgtCompId: string; kind: AgenticEdgeKind }> = [];

  add(srcCompId: string, tgtCompId: string, kind: AgenticEdgeKind): void {
    const k = `${srcCompId}::${tgtCompId}::${kind}`;
    if (this.seen.has(k)) return;
    this.seen.add(k);
    this.out.push({ srcCompId, tgtCompId, kind });
  }

  entries(): Array<{ srcCompId: string; tgtCompId: string; kind: AgenticEdgeKind }> {
    return this.out;
  }
}
