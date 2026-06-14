import type { UMLModel, UMLElement, UMLRelationship } from '@besser/wme';
import { UMLDiagramType } from '@besser/wme';
import type { ElementLineageMap } from '../../shared/types/project';
import type { DeploymentDerivationResult, DeploymentDerivationWarning } from './types';

/**
 * Component → Deployment derivation (see
 * `.claude/inter-diagram/03-component-to-deployment-derivation-plan.md`
 * and the FU-series guides under the same folder).
 *
 * - One DeploymentNode per *unique* Subsystem in the source, sibling
 *   under the diagram root (OQ-1 — nested Subsystems flatten).
 * - One synthetic `Default Host` Node iff any orphan Component exists.
 * - For each source Component (04-FU3 — UML 2.5 deployment notation):
 *     • a DeploymentComponent *above* the Node (owner=null)
 *     • a DeploymentArtifact *inside* the Node (owner=nodeId)
 *     • a DeploymentDependency from Artifact → Component
 *       (dashed, arrow at Component end — the UML 2.5 manifest signal;
 *       no `«manifest»` label because the renderer doesn't paint one
 *       on DeploymentDependency and it isn't serialized anyway).
 * - One DeploymentAssociation per unique cross-Subsystem
 *   ComponentDependency, deduplicated direction-preserving (OQ-5).
 * - Edge stereotypes (`delegates`/`supervises`/etc.) dropped silently
 *   (OQ-2). No `dropped-*` warnings.
 */
export function componentModelToDeploymentModel(
  component: UMLModel,
  // 27 — sourceComponentElementId → swarm size (N). Resolved by the caller
  // from the lineage chain (artifact→Component→lane). Optional + defaulted so
  // every existing caller and test (model-only) is unaffected; a missing or
  // ≤1 entry yields no `[N]` suffix.
  multiplicityByComponentId: Record<string, number> = {},
): DeploymentDerivationResult {
  const warnings: DeploymentDerivationWarning[] = [];

  if (component.type !== UMLDiagramType.ComponentDiagram) {
    return { ok: false, reason: 'not-a-component-diagram', warnings };
  }

  const components = collectComponents(component);
  if (components.length === 0) {
    return { ok: false, reason: 'no-components', warnings };
  }

  const subsystems = collectSubsystems(component);
  const out = emptyDeploymentModel(component.size);
  const layout = makeLayoutCursor();
  // 06-v2 — derivedElementId → sourceElementId. Populated as we emit.
  // Synthetic emissions (Default Host, manifest edges) leave no entry.
  // DeploymentArtifacts are also intentionally NOT mapped (06-v2 FU,
  // 2026-05-29): UML 2.5 §19.4 — an Artifact "manifests" a Component;
  // it is a physical packaging unit with no direct counterpart in the
  // logical source diagram. The DeploymentComponent above the Node
  // already projects the source Component; mapping the Artifact too
  // would mis-attribute the manifest as the source link.
  const elementMapping: ElementLineageMap = {};

  // 04-FU3: pre-count Components per Subsystem and orphan bucket so
  // each Node can be sized from its componentCount at emit time
  // (D-D5). With Components now outside the Node (D-D1), the Node's
  // width drives the horizontal slot layout for the inside-Node
  // Artifacts AND the above-Node Components.
  const componentsBySubsystemId = new Map<string, UMLElement[]>();
  const orphanComponents: UMLElement[] = [];
  // Walk each component's full owner chain to mark every ancestor Subsystem
  // as "alive" — needed so that Subsystems whose only *direct* children are
  // other Subsystems (OQ-1 nesting) are not incorrectly skipped.
  const aliveSubsystemIds = new Set<string>();
  for (const c of components) {
    const parentSub = immediateSubsystemParent(component, c);
    if (parentSub) {
      const arr = componentsBySubsystemId.get(parentSub.id) ?? [];
      arr.push(c);
      componentsBySubsystemId.set(parentSub.id, arr);
      // Mark entire ancestor chain as alive so nested Subsystems don't vanish.
      let ownerId: string | null = (c as unknown as { owner?: string | null }).owner ?? null;
      while (ownerId) {
        const ownerEl = component.elements[ownerId];
        if (!ownerEl) break;
        if (ownerEl.type === 'Subsystem') aliveSubsystemIds.add(ownerId);
        ownerId = (ownerEl as unknown as { owner?: string | null }).owner ?? null;
      }
    } else {
      orphanComponents.push(c);
    }
  }

  // Phase 1 — emit one DeploymentNode per unique Subsystem, sized to
  // its componentCount.
  const nodeIdBySubsystemId = new Map<string, string>();
  for (const sub of subsystems) {
    const subComps = componentsBySubsystemId.get(sub.id) ?? [];
    // Skip Subsystems whose entire subtree contained only capability Components
    // (filtered out by collectComponents): they would produce an empty node.
    // Subsystems that have no direct children but DO have descendant non-capability
    // components (via nested child Subsystems) are kept via aliveSubsystemIds.
    if (subComps.length === 0 && !aliveSubsystemIds.has(sub.id)) continue;
    const nodeId = emitDeploymentNode(out, sub.name, sub, /*synthetic*/ false, layout, subComps.length);
    nodeIdBySubsystemId.set(sub.id, nodeId);
    elementMapping[nodeId] = sub.id; // 06-v2 — DeploymentNode ← source Subsystem
  }

  // Phase 2 — emit DeploymentComponent + DeploymentArtifact + manifest
  // edge per source Component, into the Node matching its immediate
  // Subsystem parent (OQ-1) or the synthetic Default Host (if orphan).
  const nodeIdByCompId = new Map<string, string>(); // sourceComponentId → owning Node id (for cross-Node edge resolution)
  // 35 (Bug 18a) — first-occurrence dedup: the same source Component id must
  // never produce two artifact pairs. Capability Components are already excluded
  // by collectComponents; this is a defence-in-depth guard.
  const seenSourceCompIds = new Set<string>();

  for (const sub of subsystems) {
    const nodeId = nodeIdBySubsystemId.get(sub.id);
    if (!nodeId) continue;
    const subComps = componentsBySubsystemId.get(sub.id) ?? [];
    let slotIndex = 0;
    for (const comp of subComps) {
      if (seenSourceCompIds.has(comp.id)) continue; // Bug 18a: skip duplicate
      seenSourceCompIds.add(comp.id);
      // 35 (Bug 16) — capabilities are excluded by collectComponents, but gate
      // multiplicity here explicitly so a stray capability never gets [N].
      const stereo = ((comp as unknown as { stereotype?: string }).stereotype ?? '').toLowerCase().trim();
      const multip = CAPABILITY_STEREOTYPES.has(stereo) ? 1 : (multiplicityByComponentId[comp.id] ?? 1);
      const { componentId } = emitDeploymentComponentPair(out, comp, nodeId, slotIndex, multip);
      slotIndex++;
      nodeIdByCompId.set(comp.id, nodeId);
      // 06-v2 — only the DeploymentComponent (logical projection) maps
      // to the source Component; the Artifact has no source counterpart.
      elementMapping[componentId] = comp.id;
    }
  }

  if (orphanComponents.length > 0) {
    const hostId = emitDeploymentNode(out, 'Default Host', null, /*synthetic*/ true, layout, orphanComponents.length);
    // Default Host is synthetic — no entry in elementMapping (D-D1 per plan 05- § 3.3).
    let orphanSlot = 0;
    for (const comp of orphanComponents) {
      if (seenSourceCompIds.has(comp.id)) continue; // Bug 18a: skip duplicate
      seenSourceCompIds.add(comp.id);
      const stereo = ((comp as unknown as { stereotype?: string }).stereotype ?? '').toLowerCase().trim();
      const multip = CAPABILITY_STEREOTYPES.has(stereo) ? 1 : (multiplicityByComponentId[comp.id] ?? 1);
      const { componentId } = emitDeploymentComponentPair(out, comp, hostId, orphanSlot, multip);
      orphanSlot++;
      nodeIdByCompId.set(comp.id, hostId);
      elementMapping[componentId] = comp.id;
    }
  }

  // `flat-scaffold` warning: input had zero Subsystems and all
  // Components became orphans under one synthetic Node.
  if (subsystems.length === 0) {
    warnings.push({ kind: 'flat-scaffold' });
  }

  // Phase 3 — cross-Subsystem ComponentDependencies → DeploymentAssociation.
  // Intra-node deps collapse silently (OQ-2). Direction-preserving dedup (OQ-5).
  // 04-FU2 (2026-05-28): the dep endpoint may be a Component **or** a
  // Subsystem (users routinely draw Subsystem-to-Subsystem deps at the
  // logical level). Resolve via `resolveToNodeId` so both kinds map to
  // their owning Node.
  const dedup = new Set<string>();
  for (const rel of Object.values(component.relationships)) {
    if (rel.type !== 'ComponentDependency') continue;
    const srcNodeId = resolveToNodeId(component, rel.source.element, nodeIdByCompId, nodeIdBySubsystemId);
    const tgtNodeId = resolveToNodeId(component, rel.target.element, nodeIdByCompId, nodeIdBySubsystemId);
    if (!srcNodeId || !tgtNodeId) continue;
    if (srcNodeId === tgtNodeId) continue; // intra-node — silent drop
    const key = `${srcNodeId}\x00${tgtNodeId}`;
    if (dedup.has(key)) continue;
    dedup.add(key);
    const edgeId = emitDeploymentAssociation(out, srcNodeId, tgtNodeId);
    elementMapping[edgeId] = rel.id; // 06-v2 — DeploymentAssociation ← source ComponentDependency
  }

  // 16-FU8 — center the generated diagram in the user's view. The layout
  // cursor stacks Nodes rightward from x=-320, so the content bbox drifts
  // right of origin; the editor opens its canvas centered on (0,0), so the
  // diagram would otherwise open scrolled off-screen. Translate every element
  // + edge so the bbox midpoint lands at the origin.
  const placed = Object.values(out.elements);
  if (placed.length > 0) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const e of placed) {
      const b = (e as unknown as { bounds: { x: number; y: number; width: number; height: number } }).bounds;
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }
    const dx = -(minX + maxX) / 2;
    const dy = -(minY + maxY) / 2;
    for (const e of placed) {
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

  return { ok: true, model: out, warnings, elementMapping };
}

// ── Collection helpers ──────────────────────────────────────────────

/** Capability/resource stereotype tokens — these Components represent hosted
 *  services (LLM API, DB, RAG store, skill modules), not deployable containers.
 *  Keep in sync with _CAP_TOKENS in BESSER docker_compose_generator.py and
 *  CAPABILITY_TOKENS in agentic-tokens.ts. */
const CAPABILITY_STEREOTYPES = new Set(['skill', 'tool', 'llm', 'db', 'rag']);

function collectComponents(model: UMLModel): UMLElement[] {
  return Object.values(model.elements).filter((e) => {
    if (e.type !== 'Component') return false;
    const stereo = ((e as unknown as { stereotype?: string }).stereotype ?? '').toLowerCase().trim();
    return !CAPABILITY_STEREOTYPES.has(stereo);
  });
}

function collectSubsystems(model: UMLModel): UMLElement[] {
  return Object.values(model.elements).filter((e) => e.type === 'Subsystem');
}

/**
 * OQ-1: nested Subsystems flatten. We don't walk to the root — we
 * stop at the first Subsystem ancestor. If a Component has *no*
 * Subsystem ancestor, returns null (orphan → catch-all Node).
 */
function immediateSubsystemParent(model: UMLModel, el: UMLElement): UMLElement | null {
  let cur: UMLElement | null = el;
  while (cur && cur.owner) {
    const parent: UMLElement | undefined = model.elements[cur.owner];
    if (!parent) return null;
    if (parent.type === 'Subsystem') return parent;
    cur = parent;
  }
  return null;
}

/**
 * 04-FU2 (2026-05-28): resolve a ComponentDependency endpoint to the
 * DeploymentNode it belongs to. Source endpoint may be:
 *   1) a tracked Component (lookup in `nodeIdByCompId` — populated in Phase 2)
 *   2) the Subsystem itself (lookup in `nodeIdBySubsystemId` — populated in Phase 1)
 *   3) any other element nested inside a Subsystem (walk up via
 *      `immediateSubsystemParent`, then look up by that Subsystem)
 * Returns undefined if no Node mapping can be derived.
 */
function resolveToNodeId(
  model: UMLModel,
  elementId: string,
  nodeIdByCompId: Map<string, string>,
  nodeIdBySubsystemId: Map<string, string>,
): string | undefined {
  const direct = nodeIdByCompId.get(elementId);
  if (direct) return direct;
  const el = model.elements[elementId];
  if (!el) return undefined;
  if (el.type === 'Subsystem') return nodeIdBySubsystemId.get(elementId);
  const sub = immediateSubsystemParent(model, el);
  if (sub) return nodeIdBySubsystemId.get(sub.id);
  return undefined;
}

// ── Layout constants (04-FU3, revised 04-FU4) ───────────────────────

const SLOT_WIDTH = 184; // 160 px Component + 24 px gap
const NODE_MIN_WIDTH = 280;
const NODE_HEIGHT = 200;
const COMPONENT_WIDTH = 160;
const COMPONENT_HEIGHT = 60;
// 04-FU4 (2026-05-28): Artifact size lifted to match Component (was
// 120×40) so each pair reads as a same-shape Component / Artifact
// twin — user feedback on NT-1.
const ARTIFACT_WIDTH = 160;
const ARTIFACT_HEIGHT = 60;
const ARTIFACT_Y_INSIDE = 64; // px below the Node's top edge
// 04-FU4: Components flipped from above the Node to below it (user
// preference on NT-1). Edge still runs Artifact (source) → Component
// (target) per UML 2.5 manifest direction — the path coords flip but
// the relationship direction does not.
const COMPONENT_Y_BELOW_GAP = 24; // px between Node bottom and Component top

// ── Emit helpers ────────────────────────────────────────────────────

function emptyDeploymentModel(size: { width: number; height: number }): UMLModel {
  return {
    version: '3.0.0',
    type: UMLDiagramType.DeploymentDiagram,
    size,
    elements: {},
    interactive: { elements: {}, relationships: {} },
    relationships: {},
    assessments: {},
  };
}

interface LayoutCursor {
  nodeX: number;
  nodeY: number;
  currentNodeBounds: { x: number; y: number; width: number; height: number } | null;
  endNode(): void;
}

// 04-FU3: per-Node Y cursor is gone (D-D4 — fixed Y positions for
// Components above and Artifacts inside; horizontal slots within each
// Node). Cross-Node X stacking unchanged. Centred around origin so the
// first Node lands on-canvas at default zoom.
function makeLayoutCursor(): LayoutCursor {
  return {
    nodeX: -320,
    nodeY: -200,
    currentNodeBounds: null,
    endNode(this: LayoutCursor) {
      if (this.currentNodeBounds) {
        // Stack next Node to the right with 40 px gap.
        this.nodeX = this.currentNodeBounds.x + this.currentNodeBounds.width + 40;
      }
      this.currentNodeBounds = null;
    },
  };
}

const newId = (): string => 'gen-' + Math.random().toString(36).slice(2, 11);

// 27 — swarm multiplicity. Stamp the deployment **Artifact** name with the
// UML `[N]` multiplicity suffix when the source agent-lane's swarm size > 1.
// The `[N]` grammar already exists on the wire (BESSER parses it into
// `structural.Multiplicity`); this only populates it. N==1 (the default) emits
// no suffix — absence means "single instance", matching the lane XML convention
// (guide 26: the attribute is omitted when 1).
const appendMultiplicity = (base: string, n: number): string => (n > 1 ? `${base} [${n}]` : base);

function emitDeploymentNode(
  out: UMLModel,
  name: string,
  source: UMLElement | null,
  synthetic: boolean,
  layout: LayoutCursor,
  componentCount: number,
): string {
  // End the previous Node's column before starting a new one.
  layout.endNode();

  const id = newId();
  // 04-FU3 (D-D5): Node width sized from componentCount up-front
  // because Components above and Artifacts inside share horizontal
  // slots indexed off the Node's x bounds.
  const width = Math.max(NODE_MIN_WIDTH, 24 + Math.max(1, componentCount) * SLOT_WIDTH);
  const bounds = { x: layout.nodeX, y: layout.nodeY, width, height: NODE_HEIGHT };
  layout.currentNodeBounds = bounds;

  // 04-FU1 (2026-05-28): user wants the synthetic Default Host to show
  // `«node»` for consistency with the other Nodes (the OQ-4 tentative-
  // pick of `displayStereotype: false` was rejected on DT-4). Real
  // Nodes inherit the source Subsystem's `displayStereotype` (default
  // true if undefined).
  const sourceDisplay = source
    ? ((source as unknown as { displayStereotype?: boolean }).displayStereotype ?? true)
    : true;

  out.elements[id] = {
    id,
    name,
    type: 'DeploymentNode',
    owner: null,
    bounds,
    stereotype: 'node',
    displayStereotype: sourceDisplay,
  } as unknown as UMLElement;
  // `synthetic` retained for self-documentation at call sites; behavior
  // collapsed into `sourceDisplay` by F1.
  void synthetic;
  return id;
}

/**
 * 04-FU3 (UML 2.5 deployment notation rework), revised 04-FU4:
 * each source Component emits three things into the deployment model —
 *
 *  1. A `DeploymentComponent` *below* the Node (D-D1, owner=null —
 *     logical view). 04-FU4 flipped position from above to below per
 *     NT-1 user preference.
 *  2. A `DeploymentArtifact` *inside* the Node (physical placement,
 *     owner=nodeId). 04-FU4 bumped its size to 160×60 to match the
 *     Component so each pair reads as a same-shape twin.
 *  3. A `DeploymentDependency` from Artifact → Component (D-D2 —
 *     dashed line with arrow at Component end). No stereotype label
 *     (D-D3) — the dashed-arrow visual is the UML 2.5 manifest signal.
 *
 * `slotIndex` = 0-based index of this Component within its owning
 * Node, drives the horizontal slot layout (D-D4).
 */
function emitDeploymentComponentPair(
  out: UMLModel,
  source: UMLElement,
  nodeId: string,
  slotIndex: number,
  // 27 — swarm size for this source Component (defaults 1 = no suffix).
  multiplicity: number,
): { componentId: string; artifactId: string } {
  const componentId = newId();
  const artifactId = newId();
  const sourceStereotype = (source as unknown as { stereotype?: string }).stereotype ?? 'component';
  const sourceDisplay = (source as unknown as { displayStereotype?: boolean }).displayStereotype ?? true;
  const parent = out.elements[nodeId] as unknown as {
    bounds: { x: number; y: number; width: number; height: number };
  };

  // D-D4 — horizontal slot starts at parent.x + 24 + slotIndex*184.
  const slotLeft = parent.bounds.x + 24 + slotIndex * SLOT_WIDTH;

  // Artifact inside the Node, owner=nodeId. With 04-FU4's matched
  // size (160×60) it aligns with the Component at slotLeft.
  const artifactBounds = {
    x: slotLeft,
    y: parent.bounds.y + ARTIFACT_Y_INSIDE,
    width: ARTIFACT_WIDTH,
    height: ARTIFACT_HEIGHT,
  };
  // 04-FU4 — Component below the Node, owner=null (D-D1).
  const componentBounds = {
    x: slotLeft,
    y: parent.bounds.y + parent.bounds.height + COMPONENT_Y_BELOW_GAP,
    width: COMPONENT_WIDTH,
    height: COMPONENT_HEIGHT,
  };

  out.elements[componentId] = {
    id: componentId,
    name: source.name || 'Component',
    type: 'DeploymentComponent',
    owner: null, // D-D1 — outside the Node
    bounds: componentBounds,
    stereotype: sourceStereotype,
    displayStereotype: sourceDisplay,
  } as unknown as UMLElement;

  // 33 (6b-1) — carry the agent-diagram UUID one step further down the chain:
  // the source Component picked it up from its lane during BPMN→Component
  // (Step 4); copy it onto the Artifact so BESSER's deployment generator can
  // resolve Artifact → Agent diagram by exact id (full-via-Artifact, memo
  // 07 § 8). Absent when the source Component was hand-drawn / never linked.
  const sourceAgentModelRef = (source as unknown as { agentModelRef?: string }).agentModelRef;
  out.elements[artifactId] = {
    id: artifactId,
    // 27 — only the **Artifact** (physical packaging / runtime instance) carries
    // the swarm count. The DeploymentComponent above stays count-free — it is the
    // logical agent *type* projection (`25-…` § 8.2).
    name: appendMultiplicity(source.name || 'Artifact', multiplicity),
    type: 'DeploymentArtifact',
    owner: nodeId, // inside the Node
    bounds: artifactBounds,
    // 20 — BESSER `Artifact.manifests` (UML 2.5 § 19.4): the cross-diagram
    // id of the source Component this artifact manifests. `source.id` is the
    // Component-diagram Component's WME element id — the same id the paired
    // DeploymentComponent's lineage uses (see elementMapping below) and the
    // exact key BESSER's deployment validator resolves against
    // (`Component.layout["id"]`). Auto-set here; no popup needed.
    manifests: [source.id],
    // 33 (6b-1) — Agent-diagram UUID this artifact deploys (full-via-Artifact).
    ...(sourceAgentModelRef ? { agentModelRef: sourceAgentModelRef } : {}),
  } as unknown as UMLElement;

  // Manifest edge: dashed, arrow at Component end (D-D2).
  emitManifestDependency(out, artifactId, artifactBounds, componentId, componentBounds);

  return { componentId, artifactId };
}

function emitManifestDependency(
  out: UMLModel,
  artifactId: string,
  artifactBounds: { x: number; y: number; width: number; height: number },
  componentId: string,
  componentBounds: { x: number; y: number; width: number; height: number },
): void {
  const id = newId();
  // D-D2 — emit as DeploymentDependency so the renderer paints it
  // dashed (strokeDasharray=7) with an arrow at the target end
  // (markerEnd). Source = Artifact, target = Component → arrow lands
  // at the Component (UML 2.5: arrow points at the manifested element).
  // D-D3 — no `stereotype` field. The renderer gates label rendering
  // on `element.type === 'ComponentDependency'`, and
  // UMLDeploymentDependency.serialize does not persist a stereotype
  // field anyway. The dashed arrow alone IS the UML 2.5 signal.
  //
  // 04-FU4 (2026-05-28): Component is BELOW the Node now, so the edge
  // runs Artifact bottom-centre → Component top-centre (was top↔bottom
  // when Component was above). Relationship direction (source =
  // Artifact, target = Component) is unchanged — only the path coords
  // flip. Endpoint `direction` hints flip too so the editor's edge
  // router lands the connectors correctly.
  const artifactBottomCx = artifactBounds.x + artifactBounds.width / 2;
  const artifactBottomY = artifactBounds.y + artifactBounds.height;
  const componentTopCx = componentBounds.x + componentBounds.width / 2;
  const componentTopY = componentBounds.y;
  out.relationships[id] = {
    id,
    name: '',
    type: 'DeploymentDependency',
    owner: null,
    bounds: {
      x: Math.min(artifactBottomCx, componentTopCx) - 4,
      y: artifactBottomY,
      width: Math.abs(artifactBottomCx - componentTopCx) + 8,
      height: Math.max(8, componentTopY - artifactBottomY),
    },
    path: [
      { x: artifactBottomCx, y: artifactBottomY },
      { x: componentTopCx, y: componentTopY },
    ],
    source: { element: artifactId, direction: 'Down' },
    target: { element: componentId, direction: 'Up' },
  } as unknown as UMLRelationship;
}

function emitDeploymentAssociation(out: UMLModel, srcNodeId: string, tgtNodeId: string): string {
  const id = newId();
  const src = (
    out.elements[srcNodeId] as unknown as {
      bounds: { x: number; y: number; width: number; height: number };
    }
  ).bounds;
  const tgt = (
    out.elements[tgtNodeId] as unknown as {
      bounds: { x: number; y: number; width: number; height: number };
    }
  ).bounds;
  out.relationships[id] = {
    id,
    name: '',
    type: 'DeploymentAssociation',
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
    source: { element: srcNodeId, direction: 'Right' },
    target: { element: tgtNodeId, direction: 'Left' },
    // D-D2 / OQ-2 — agentic edge stereotypes are NOT carried over.
    // Leave `stereotype` undefined.
  } as unknown as UMLRelationship;
  return id;
}
