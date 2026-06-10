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

// Agentic lane multiplicity (meeting 2026-06-08 §3): the swarm-size count —
// how many identical copies of this agent form the swarm. Integer ≥ 1,
// default 1, no upper cap (O3d). [[swarm-multiplicity-semantics]]
export const clampMultiplicity = (n: number): number => Math.max(1, Math.round(n));

// Agentic BPMN — gateway role (T1/P3′ rationalization, 2026-06-10). The
// diverging-vs-merging split survives the rework: it still classifies an
// agentic gateway and drives the governance section on the merging side.
// The SEAA'25 collaboration-mode / merging-strategy enums were DELETED — the
// merge axis now speaks governance (level 3, see `.claude/governance-dsl/`),
// not invented BPMN vocabulary. See `.claude/rationalization/01-…`.
export type BPMNGatewayRole = 'diverging' | 'merging';

// Agentic BPMN extension (04D2 — paper §5, BPMN 2.0.2 § 8.2.3 extension
// mechanism). Custom namespace declared at <bpmn:definitions>; each agentic
// construct emits a `<bpmn:extensionElements><agentic:agentic .../></...>`
// block as its first child. Flat-attribute shape per 04D2 D-D1.
export const AGENTIC_NS_URI = 'https://www.besser-pearl.org/bpmn/agentic';
export const AGENTIC_NS_PREFIX = 'agentic';
