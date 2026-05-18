import { UMLElementType } from '../../uml-element-type';
import { BPMNFlowType } from './bpmn-flow';
import { getAllowedBpmnFlowTypes } from './bpmn-flow-semantics';
import { BPMNCollaborationMode } from '../common/types';

// BPMN 2.0.2 § 8.3.13, p. 98 + §§ 10.5.4 / 10.5.6: a default outgoing sequence
// flow may originate only from an Exclusive/Inclusive/Complex gateway or an
// Activity. This is the single source of truth — previously copy-pasted into
// bpmn-flow-update.tsx, bpmn-xml-exporter.ts and bpmn-xml-importer.ts (04A1 §11).
const DEFAULT_ELIGIBLE_ACTIVITY_TYPES: ReadonlySet<string> = new Set<string>([
  UMLElementType.BPMNTask,
  UMLElementType.BPMNSubprocess,
  UMLElementType.BPMNTransaction,
  UMLElementType.BPMNCallActivity,
]);
const DEFAULT_ELIGIBLE_GATEWAY_TYPES: ReadonlySet<string> = new Set<string>(['exclusive', 'inclusive', 'complex']);

/**
 * Duck-typed source element: works for both editor `UMLElement` instances and
 * the serialized `AnyBPMNElement` plain objects used in webapp2's exporter /
 * importer. `gatewayType` is only present on BPMNGateway.
 */
export interface DefaultFlowSource {
  type: string;
  gatewayType?: string;
}

/** BPMN 2.0.2 § 8.3.13 — can this element be the source of a default sequence flow? */
export function canSourceCarryDefault(source: DefaultFlowSource | undefined): boolean {
  if (!source) return false;
  if (DEFAULT_ELIGIBLE_ACTIVITY_TYPES.has(source.type)) return true;
  if (source.type === UMLElementType.BPMNGateway) {
    return DEFAULT_ELIGIBLE_GATEWAY_TYPES.has(source.gatewayType ?? '');
  }
  return false;
}

export type BPMNFlowValidationCode = 'missing-endpoint' | 'illegal-flow-type' | 'default-flow-illegal-source';

export interface BPMNFlowValidationWarning {
  code: BPMNFlowValidationCode;
  flowId: string;
  sourceElementId: string;
  targetElementId: string;
  message: string;
}

/** Minimal duck-typed shapes — the validator only reads, never constructs. */
type AnyElement = { id: string; type: string; gatewayType?: string };
type AnyFlow = AnyElement & {
  flowType?: BPMNFlowType;
  isDefault?: boolean;
  source: { element: string };
  target: { element: string };
};

/** Validate a single BPMN flow against its endpoints. Returns 0+ warnings. */
export function validateBpmnFlow(flow: AnyFlow, elementsById: Record<string, AnyElement>): BPMNFlowValidationWarning[] {
  const warnings: BPMNFlowValidationWarning[] = [];
  const source = elementsById[flow.source.element];
  const target = elementsById[flow.target.element];

  if (!source || !target) {
    warnings.push({
      code: 'missing-endpoint',
      flowId: flow.id,
      sourceElementId: flow.source.element,
      targetElementId: flow.target.element,
      message: `Flow ${flow.id} references a missing ${!source ? 'source' : 'target'} element.`,
    });
    return warnings; // can't check the rest without endpoints
  }

  const flowType = flow.flowType ?? 'sequence';
  const allowed = getAllowedBpmnFlowTypes(source.type as UMLElementType, target.type as UMLElementType);
  if (!allowed.includes(flowType)) {
    warnings.push({
      code: 'illegal-flow-type',
      flowId: flow.id,
      sourceElementId: source.id,
      targetElementId: target.id,
      message: `Illegal flow type "${flowType}" for ${source.type} → ${target.type} (allowed: ${
        allowed.join(', ') || 'none'
      }).`,
    });
  }

  if (flow.isDefault && (flowType !== 'sequence' || !canSourceCarryDefault(source))) {
    warnings.push({
      code: 'default-flow-illegal-source',
      flowId: flow.id,
      sourceElementId: source.id,
      targetElementId: target.id,
      message: `Flow ${flow.id} is marked default but its source ${source.type} cannot carry a default sequence flow.`,
    });
  }

  return warnings;
}

/** Validate every BPMN flow in an elements map. */
export function validateAllBpmnFlows(elementsById: Record<string, AnyElement>): BPMNFlowValidationWarning[] {
  const out: BPMNFlowValidationWarning[] = [];
  for (const el of Object.values(elementsById)) {
    if (el.type === 'BPMNFlow') {
      out.push(...validateBpmnFlow(el as AnyFlow, elementsById));
    }
  }
  return out;
}

// ─── Agentic collaboration-mode resolution (04D2-followup F1) ───────────────
//
// Paper §4.3: a collaboration block is enclosed between a diverging and a
// merging gateway. The diverging gateway carries the `CollaborationMode`;
// the merging gateway and any agentic task inside the block *inherit* it.
// These helpers resolve that inheritance from a unified elements+flows map
// (same shape used by validateAllBpmnFlows after the 04C FB1 fix).

type AnyAgenticGateway = AnyElement & {
  isAgentic?: boolean;
  gatewayRole?: 'diverging' | 'merging';
  collaborationMode?: BPMNCollaborationMode;
};

type AnyAgenticTask = AnyElement & { isAgentic?: boolean };

// Max BFS depth — guards against degenerate flow graphs. Typical BPMN
// diagrams stay well under this.
const MAX_COLLAB_WALK_DEPTH = 50;

/**
 * Walk backwards from `elementId` via incoming sequence flows. Return the
 * `collaborationMode` of the nearest agentic diverging gateway, or undefined
 * if none is reachable.
 *
 * BFS hop-count gives correct nested-collaboration pairing — the inner block
 * resolves to the inner diverging gateway. Cycle-safe via the visited set.
 */
export function resolveUpstreamCollabMode(
  elementId: string,
  elementsById: Record<string, AnyElement>,
): BPMNCollaborationMode | undefined {
  const visited = new Set<string>();
  let frontier: string[] = [elementId];
  for (let depth = 0; depth < MAX_COLLAB_WALK_DEPTH && frontier.length > 0; depth++) {
    const next: string[] = [];
    for (const id of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);
      for (const el of Object.values(elementsById)) {
        if (el.type !== 'BPMNFlow') continue;
        const flow = el as AnyFlow;
        if (flow.flowType !== 'sequence') continue;
        if (flow.target.element !== id) continue;
        const srcId = flow.source.element;
        if (visited.has(srcId)) continue;
        const src = elementsById[srcId] as AnyAgenticGateway | undefined;
        if (src && src.type === 'BPMNGateway' && src.isAgentic === true && src.gatewayRole === 'diverging') {
          return src.collaborationMode;
        }
        next.push(srcId);
      }
    }
    frontier = next;
  }
  return undefined;
}

/**
 * Forward-walk from a diverging gateway via outgoing sequence flows. Collect
 * the IDs of every reachable agentic task and agentic merging gateway. Stops
 * at any other agentic diverging gateway — nested-collab boundary. Used by
 * the diverging-gateway popup to propagate `collaborationMode` changes
 * (04D2-followup F-D5).
 */
export function findDownstreamAgenticConstructs(
  divergingGatewayId: string,
  elementsById: Record<string, AnyElement>,
): { taskIds: string[]; mergingGatewayIds: string[] } {
  const visited = new Set<string>([divergingGatewayId]);
  const queue: string[] = [divergingGatewayId];
  const taskIds: string[] = [];
  const mergingGatewayIds: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const el of Object.values(elementsById)) {
      if (el.type !== 'BPMNFlow') continue;
      const flow = el as AnyFlow;
      if (flow.flowType !== 'sequence') continue;
      if (flow.source.element !== current) continue;
      const tgtId = flow.target.element;
      if (visited.has(tgtId)) continue;
      visited.add(tgtId);
      const tgt = elementsById[tgtId] as AnyAgenticGateway | AnyAgenticTask | undefined;
      if (!tgt) continue;
      // Nested-collab boundary: stop, don't propagate past another diverging gateway.
      if (
        tgt.type === 'BPMNGateway' &&
        (tgt as AnyAgenticGateway).isAgentic === true &&
        (tgt as AnyAgenticGateway).gatewayRole === 'diverging'
      ) {
        continue;
      }
      if (
        tgt.type === 'BPMNGateway' &&
        (tgt as AnyAgenticGateway).isAgentic === true &&
        (tgt as AnyAgenticGateway).gatewayRole === 'merging'
      ) {
        mergingGatewayIds.push(tgtId);
      }
      if (tgt.type === 'BPMNTask' && (tgt as AnyAgenticTask).isAgentic === true) {
        taskIds.push(tgtId);
      }
      queue.push(tgtId);
    }
  }
  return { taskIds, mergingGatewayIds };
}

/**
 * Return the IDs of every agentic merging gateway in the model whose upstream
 * resolution yields no agentic diverging gateway. Used by the importer to
 * surface a validation warning (04D2-followup F3).
 */
export function findOrphanedMergingGateways(elementsById: Record<string, AnyElement>): string[] {
  const orphans: string[] = [];
  for (const el of Object.values(elementsById)) {
    if (el.type !== 'BPMNGateway') continue;
    const gw = el as AnyAgenticGateway;
    if (gw.isAgentic !== true || gw.gatewayRole !== 'merging') continue;
    if (resolveUpstreamCollabMode(gw.id, elementsById) === undefined) {
      orphans.push(gw.id);
    }
  }
  return orphans;
}
