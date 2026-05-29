import type { UMLModel } from '@besser/wme';
import type { ElementLineageMap } from '../../shared/types/project';

/**
 * Outcome of `bpmnModelToComponentModel`.
 *
 * The transform never throws on user-content issues — it returns
 * structured warnings so the calling UI can surface them as a toast
 * or a "Generated with N warnings" hint.
 *
 * `model` is `null` when the input is unusable (e.g. a flat BPMN with
 * no pool / lane structure — see plan § 3 pre-conditions).
 *
 * `elementMapping` (06-v2): derived element id → source BPMN element
 * id. Synthetic emissions (external Components) have no entry.
 */
export type DerivationResult =
  | { ok: true; model: UMLModel; warnings: DerivationWarning[]; elementMapping: ElementLineageMap }
  | { ok: false; reason: DerivationRefusalReason; warnings: DerivationWarning[] };

export type DerivationRefusalReason = 'no-pools' | 'no-lanes-in-any-pool' | 'not-a-bpmn-diagram';

export type DerivationWarning =
  | { kind: 'multi-hop-gateway'; sourceTaskId: string; targetGatewayId: string }
  | { kind: 'flow-skipped-non-agentic-source'; flowId: string }
  | { kind: 'dropped-task-in-non-agentic-lane'; taskId: string }
  | { kind: 'inferred-external-component'; messageFlowId: string };

/**
 * Outcome of `componentModelToDeploymentModel`.
 *
 * Mirrors `DerivationResult` but for the Component → Deployment
 * derivation. Kept as a sibling type (not a generic) to avoid
 * overloading the BPMN-side discriminated union — the calling UI
 * code only ever handles one direction at a time.
 *
 * See `.claude/inter-diagram/03-component-to-deployment-derivation-plan.md`.
 */
export type DeploymentDerivationResult =
  | { ok: true; model: UMLModel; warnings: DeploymentDerivationWarning[]; elementMapping: ElementLineageMap }
  | { ok: false; reason: DeploymentDerivationRefusalReason; warnings: DeploymentDerivationWarning[] };

export type DeploymentDerivationRefusalReason =
  /** The input model.type is not ComponentDiagram. Defensive guard. */
  | 'not-a-component-diagram'
  /** The Component model has zero Component elements (empty diagram). */
  | 'no-components';

/**
 * Per OQ-2, intra-Subsystem dependency drops and agentic-edge stereotype
 * drops are *not* warnings — they're correct behaviour from the
 * Deployment view's perspective. The only thing we surface is
 * `flat-scaffold`: the input had no Subsystems, so the result is one
 * synthetic `Default Host` Node — likely a surprise on a structured
 * diagram, worth flagging.
 */
export type DeploymentDerivationWarning = { kind: 'flat-scaffold' };
