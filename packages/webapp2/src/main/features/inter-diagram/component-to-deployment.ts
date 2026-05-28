import type { UMLModel, UMLElement, UMLRelationship } from '@besser/wme';
import { UMLDiagramType } from '@besser/wme';
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
export function componentModelToDeploymentModel(component: UMLModel): DeploymentDerivationResult {
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

  // 04-FU3: pre-count Components per Subsystem and orphan bucket so
  // each Node can be sized from its componentCount at emit time
  // (D-D5). With Components now outside the Node (D-D1), the Node's
  // width drives the horizontal slot layout for the inside-Node
  // Artifacts AND the above-Node Components.
  const componentsBySubsystemId = new Map<string, UMLElement[]>();
  const orphanComponents: UMLElement[] = [];
  for (const c of components) {
    const parentSub = immediateSubsystemParent(component, c);
    if (parentSub) {
      const arr = componentsBySubsystemId.get(parentSub.id) ?? [];
      arr.push(c);
      componentsBySubsystemId.set(parentSub.id, arr);
    } else {
      orphanComponents.push(c);
    }
  }

  // Phase 1 — emit one DeploymentNode per unique Subsystem, sized to
  // its componentCount.
  const nodeIdBySubsystemId = new Map<string, string>();
  for (const sub of subsystems) {
    const subComps = componentsBySubsystemId.get(sub.id) ?? [];
    const nodeId = emitDeploymentNode(out, sub.name, sub, /*synthetic*/ false, layout, subComps.length);
    nodeIdBySubsystemId.set(sub.id, nodeId);
  }

  // Phase 2 — emit DeploymentComponent + DeploymentArtifact + manifest
  // edge per source Component, into the Node matching its immediate
  // Subsystem parent (OQ-1) or the synthetic Default Host (if orphan).
  const nodeIdByCompId = new Map<string, string>(); // sourceComponentId → owning Node id (for cross-Node edge resolution)

  for (const sub of subsystems) {
    const nodeId = nodeIdBySubsystemId.get(sub.id);
    if (!nodeId) continue;
    const subComps = componentsBySubsystemId.get(sub.id) ?? [];
    for (let i = 0; i < subComps.length; i++) {
      emitDeploymentComponentPair(out, subComps[i], nodeId, i);
      nodeIdByCompId.set(subComps[i].id, nodeId);
    }
  }

  if (orphanComponents.length > 0) {
    const hostId = emitDeploymentNode(out, 'Default Host', null, /*synthetic*/ true, layout, orphanComponents.length);
    for (let i = 0; i < orphanComponents.length; i++) {
      emitDeploymentComponentPair(out, orphanComponents[i], hostId, i);
      nodeIdByCompId.set(orphanComponents[i].id, hostId);
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
    emitDeploymentAssociation(out, srcNodeId, tgtNodeId);
  }

  return { ok: true, model: out, warnings };
}

// ── Collection helpers ──────────────────────────────────────────────

function collectComponents(model: UMLModel): UMLElement[] {
  return Object.values(model.elements).filter((e) => e.type === 'Component');
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
function emitDeploymentComponentPair(out: UMLModel, source: UMLElement, nodeId: string, slotIndex: number): string {
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

  out.elements[artifactId] = {
    id: artifactId,
    name: source.name || 'Artifact',
    type: 'DeploymentArtifact',
    owner: nodeId, // inside the Node
    bounds: artifactBounds,
  } as unknown as UMLElement;

  // Manifest edge: dashed, arrow at Component end (D-D2).
  emitManifestDependency(out, artifactId, artifactBounds, componentId, componentBounds);

  return componentId;
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

function emitDeploymentAssociation(out: UMLModel, srcNodeId: string, tgtNodeId: string): void {
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
}
