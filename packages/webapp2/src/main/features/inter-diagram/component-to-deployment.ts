import type { UMLModel, UMLElement, UMLRelationship } from '@besser/wme';
import { UMLDiagramType } from '@besser/wme';
import type { DeploymentDerivationResult, DeploymentDerivationWarning } from './types';

/**
 * Component → Deployment derivation (see
 * `.claude/inter-diagram/03-component-to-deployment-derivation-plan.md`).
 *
 * - One DeploymentNode per *unique* Subsystem in the source, sibling
 *   under the diagram root (OQ-1 — nested Subsystems flatten).
 * - One synthetic `Default Host` Node iff any orphan Component exists.
 * - One DeploymentComponent per source Component, placed in the Node
 *   matching its **immediate** Subsystem parent (or the catch-all).
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

  // Phase 1 — emit one DeploymentNode per unique Subsystem.
  const nodeIdBySubsystemId = new Map<string, string>();
  for (const sub of subsystems) {
    const nodeId = emitDeploymentNode(out, sub.name, sub, /*synthetic*/ false, layout);
    nodeIdBySubsystemId.set(sub.id, nodeId);
  }

  // Phase 2 — place each Component in the Node matching its
  // *immediate* Subsystem parent (OQ-1 — no walking up the chain
  // beyond the first Subsystem).
  const orphanComponents: UMLElement[] = [];
  const nodeIdByCompId = new Map<string, string>(); // sourceComponentId → its Node's id (for edge resolution)

  let defaultHostNodeId: string | null = null;
  const ensureDefaultHost = (): string => {
    if (defaultHostNodeId) return defaultHostNodeId;
    defaultHostNodeId = emitDeploymentNode(out, 'Default Host', null, /*synthetic*/ true, layout);
    return defaultHostNodeId;
  };

  for (const c of components) {
    const parentSub = immediateSubsystemParent(component, c);
    if (parentSub) {
      const nodeId = nodeIdBySubsystemId.get(parentSub.id);
      if (!nodeId) continue; // defensive — Phase 1 should have emitted them all
      emitDeploymentComponent(out, c, nodeId, layout);
      nodeIdByCompId.set(c.id, nodeId);
    } else {
      orphanComponents.push(c);
    }
  }

  if (orphanComponents.length > 0) {
    const hostId = ensureDefaultHost();
    for (const c of orphanComponents) {
      emitDeploymentComponent(out, c, hostId, layout);
      nodeIdByCompId.set(c.id, hostId);
    }
  }

  // `flat-scaffold` warning: input had zero Subsystems and all
  // Components became orphans under one synthetic Node.
  if (subsystems.length === 0) {
    warnings.push({ kind: 'flat-scaffold' });
  }

  // Phase 3 — cross-Subsystem ComponentDependencies → DeploymentAssociation.
  // Intra-node deps collapse silently (OQ-2). Direction-preserving dedup (OQ-5).
  const dedup = new Set<string>();
  for (const rel of Object.values(component.relationships)) {
    if (rel.type !== 'ComponentDependency') continue;
    const srcCompId = rel.source.element;
    const tgtCompId = rel.target.element;
    const srcNodeId = nodeIdByCompId.get(srcCompId);
    const tgtNodeId = nodeIdByCompId.get(tgtCompId);
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
  childCursorY: number; // y for next DeploymentComponent inside the current Node
  endNode(): void;
}

// Mirrors `bpmn-to-component.ts` makeLayoutCursor — centre around
// origin so the first Node lands on-canvas at default zoom.
function makeLayoutCursor(): LayoutCursor {
  return {
    nodeX: -320,
    nodeY: -200,
    currentNodeBounds: null,
    childCursorY: 0,
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
): string {
  // End the previous Node's column before starting a new one.
  layout.endNode();

  const id = newId();
  const bounds = { x: layout.nodeX, y: layout.nodeY, width: 280, height: 200 };
  layout.currentNodeBounds = bounds;
  // 04-FU1 (2026-05-28): start the child cursor below the Node's
  // title strip (which renders `«node»` + name in ~50px). 40 was too
  // tight — DT-5/DT-7 showed the first child clipping the name line.
  layout.childCursorY = bounds.y + 64;

  // 04-FU1 (2026-05-28): user wants the synthetic Default Host to
  // show `«node»` for consistency with the other Nodes (the OQ-4
  // tentative-pick of `displayStereotype: false` was rejected on DT-4).
  // Real Nodes inherit the source Subsystem's `displayStereotype`
  // (default true if undefined).
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
  // Suppress the `synthetic` unused-arg warning — the parameter is
  // kept on the signature for self-documentation at the call site
  // (`ensureDefaultHost` passes `true`), even though F1's consistency
  // fix means the value no longer changes behavior.
  void synthetic;
  return id;
}

function emitDeploymentComponent(out: UMLModel, source: UMLElement, nodeId: string, layout: LayoutCursor): string {
  // 04-FU1 (2026-05-28): every DeploymentComponent gets a paired
  // DeploymentArtifact inside the same Node, linked by a
  // DeploymentAssociation with `stereotype: 'manifest'` (UML 2.5 § 19
  // Manifestation: Artifact "manifests" Component, edge source = Artifact).
  // Layout: Component sits above, Artifact sits below, manifest edge
  // between them.
  const componentId = newId();
  const artifactId = newId();
  const sourceStereotype = (source as unknown as { stereotype?: string }).stereotype ?? 'component';
  const sourceDisplay = (source as unknown as { displayStereotype?: boolean }).displayStereotype ?? true;
  const parent = out.elements[nodeId] as unknown as {
    bounds: { x: number; y: number; width: number; height: number };
  };

  // Component: 160×60 at parent.x+24, childCursorY.
  const componentBounds = {
    x: parent.bounds.x + 24,
    y: layout.childCursorY,
    width: 160,
    height: 60,
  };
  // Artifact: 120×40, centred under the Component, 24 px gap below.
  const artifactBounds = {
    x: parent.bounds.x + 44,
    y: componentBounds.y + componentBounds.height + 24,
    width: 120,
    height: 40,
  };
  // Advance cursor past the pair + 24 px gap before the next pair.
  layout.childCursorY = artifactBounds.y + artifactBounds.height + 24;
  // Grow the parent Node if the pair overflows its initial height.
  const pairBottom = artifactBounds.y + artifactBounds.height + 16;
  if (pairBottom > parent.bounds.y + parent.bounds.height) {
    parent.bounds.height = pairBottom - parent.bounds.y;
    if (layout.currentNodeBounds) layout.currentNodeBounds.height = parent.bounds.height;
  }

  out.elements[componentId] = {
    id: componentId,
    name: source.name || 'Component',
    type: 'DeploymentComponent',
    owner: nodeId,
    bounds: componentBounds,
    stereotype: sourceStereotype,
    displayStereotype: sourceDisplay,
  } as unknown as UMLElement;

  // Same name as Component (user pick — 04-FU1 question 2). User
  // renames during refinement.
  out.elements[artifactId] = {
    id: artifactId,
    name: source.name || 'Artifact',
    type: 'DeploymentArtifact',
    owner: nodeId,
    bounds: artifactBounds,
  } as unknown as UMLElement;

  // Manifest edge: Artifact (source) → Component (target).
  emitManifestAssociation(out, artifactId, artifactBounds, componentId, componentBounds);

  return componentId;
}

function emitManifestAssociation(
  out: UMLModel,
  artifactId: string,
  artifactBounds: { x: number; y: number; width: number; height: number },
  componentId: string,
  componentBounds: { x: number; y: number; width: number; height: number },
): void {
  const id = newId();
  // Vertical edge from Artifact top-centre up to Component bottom-centre.
  const artifactTopCx = artifactBounds.x + artifactBounds.width / 2;
  const artifactTopY = artifactBounds.y;
  const componentBottomCx = componentBounds.x + componentBounds.width / 2;
  const componentBottomY = componentBounds.y + componentBounds.height;
  out.relationships[id] = {
    id,
    name: '',
    type: 'DeploymentAssociation',
    owner: null,
    bounds: {
      x: Math.min(artifactTopCx, componentBottomCx) - 4,
      y: componentBottomY,
      width: Math.abs(artifactTopCx - componentBottomCx) + 8,
      height: Math.max(8, artifactTopY - componentBottomY),
    },
    path: [
      { x: artifactTopCx, y: artifactTopY },
      { x: componentBottomCx, y: componentBottomY },
    ],
    source: { element: artifactId, direction: 'Up' },
    target: { element: componentId, direction: 'Down' },
    stereotype: 'manifest',
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
