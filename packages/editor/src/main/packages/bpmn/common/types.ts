export type BPMNMarkerType = 'none' | 'parallel multi instance' | 'sequential multi instance' | 'loop';

// Agentic BPMN attributes (SEAA'25 / CAiSE'25 extension — paper §4.1–§4.2).
// Folded into the base BPMNSwimlane / BPMNTask as an `isAgentic` flag rather
// than separate element types (04D pivot — see 04D guide §1).
// - BPMNAgentRole: the lane's agent category. Aligned (guide 48) with the
//   Component-diagram AgentCategory vocabulary (AGENT_CATEGORY_TOKENS in
//   common/agentic/agentic-tokens.ts) so the BPMN→Component derivation maps a
//   lane role straight onto an AgentCategory stereotype with no translation.
//   The enum is extensible per the paper; these four are the canonical set.
// - BPMNReflectionMode: the SelfReflection / CrossReflection / HumanReflection
//   subclasses flattened to an attribute enum; 'none' covers the optional case.
// - clampTrustScore: trustScore is a 0–100 percentage (paper §4.1 / §4.2).
export type BPMNAgentRole = 'solution' | 'supervision' | 'collaboration' | 'consensus';

// Legacy → new role migration (guide 48). Pre-48 diagrams / .bpmn files /
// modeling-agent output carry the old binary enum; map it on every input
// boundary (JSON deserialize, XML import, agent injection) so the role is
// never silently dropped. Unknown values fall back to the default 'solution'.
const LEGACY_ROLE_MAP: Record<string, BPMNAgentRole> = {
  worker: 'solution',
  manager: 'supervision',
};

export function migrateLegacyRole(role: unknown): BPMNAgentRole {
  if (typeof role !== 'string') return 'solution';
  if (role === 'solution' || role === 'supervision' || role === 'collaboration' || role === 'consensus') {
    return role;
  }
  return LEGACY_ROLE_MAP[role] ?? 'solution';
}

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
