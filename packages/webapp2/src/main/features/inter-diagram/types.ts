import type { UMLModel } from '@besser/wme';

/**
 * Outcome of `bpmnModelToComponentModel`.
 *
 * The transform never throws on user-content issues — it returns
 * structured warnings so the calling UI can surface them as a toast
 * or a "Generated with N warnings" hint.
 *
 * `model` is `null` when the input is unusable (e.g. a flat BPMN with
 * no pool / lane structure — see plan § 3 pre-conditions).
 */
export type DerivationResult =
  | { ok: true; model: UMLModel; warnings: DerivationWarning[] }
  | { ok: false; reason: DerivationRefusalReason; warnings: DerivationWarning[] };

export type DerivationRefusalReason =
  | 'no-pools'
  | 'no-lanes-in-any-pool'
  | 'not-a-bpmn-diagram';

export type DerivationWarning =
  | { kind: 'multi-hop-gateway'; sourceTaskId: string; targetGatewayId: string }
  | { kind: 'flow-skipped-non-agentic-source'; flowId: string }
  | { kind: 'dropped-task-in-non-agentic-lane'; taskId: string }
  | { kind: 'inferred-external-component'; messageFlowId: string };
