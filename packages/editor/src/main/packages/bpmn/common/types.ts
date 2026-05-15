export type BPMNMarkerType = 'none' | 'parallel multi instance' | 'sequential multi instance' | 'loop';

// Agentic BPMN attributes (SEAA'25 / CAiSE'25 extension — paper §4.1–§4.2).
// Folded into the base BPMNSwimlane / BPMNTask as an `isAgentic` flag rather
// than separate element types (04D pivot — see 04D guide §1).
// - BPMNAgentRole: the v2 Profile.role (RoleEnum). The paper notes the enum is
//   extensible (e.g. 'coder') — kept minimal for the foundation.
// - BPMNReflectionMode: the SelfReflection / CrossReflection / HumanReflection
//   subclasses flattened to an attribute enum; 'none' covers the optional case.
// - clampTrustScore: trustScore is a 0–100 percentage (paper §4.1 / §4.2).
export type BPMNAgentRole = 'worker' | 'manager';

export type BPMNReflectionMode = 'none' | 'self' | 'cross' | 'human';

export const clampTrustScore = (n: number): number => Math.min(100, Math.max(0, Math.round(n)));

// Agentic BPMN — collaboration & gateways (04D1 — paper §4.3, Fig 4).
// `CollaborationMode` is flattened from the paper's abstract hierarchy:
// Cooperation (Voting/Role/Debate) + Competition. The merging strategy is a
// flat enum (D-D3) keyed by mode; `mergingStrategiesFor(mode)` returns the
// valid values, matching the paper's two-letter notation (Table 2).
// `BPMNGatewayRole` keeps the paper's diverging-vs-merging split on the
// agentic gateway. Message flows carry both `collaborationMode` and
// `mergingStrategy` simultaneously (the source end is the outgoing side,
// the target end is the incoming side — direction is already in the flow).
export type BPMNCollaborationMode = 'voting' | 'role' | 'debate' | 'competition';

export type BPMNMergingStrategy =
  | 'majority'
  | 'absolute-majority'
  | 'minority'
  | 'leader-driven'
  | 'composed'
  | 'fastest'
  | 'most-complete';

export type BPMNGatewayRole = 'diverging' | 'merging';

// Strategies valid for each collaboration mode. Debate may use either the
// voting or role strategies (paper §4.3, last paragraph).
export const mergingStrategiesFor = (mode: BPMNCollaborationMode): BPMNMergingStrategy[] => {
  switch (mode) {
    case 'voting':
      return ['majority', 'absolute-majority', 'minority'];
    case 'role':
      return ['leader-driven', 'composed'];
    case 'competition':
      return ['fastest', 'most-complete'];
    case 'debate':
      return ['majority', 'absolute-majority', 'minority', 'leader-driven', 'composed'];
  }
};
