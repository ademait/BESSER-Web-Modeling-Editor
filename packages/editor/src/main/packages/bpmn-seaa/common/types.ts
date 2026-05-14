// Agentic BPMN shared attribute types (paper §4.1–§4.2).
// - BPMNAgentRole: the v2 Profile.role (RoleEnum). The paper notes the enum is
//   extensible (e.g. 'coder') — kept minimal for the foundation.
// - clampTrustScore: trustScore is a 0–100 percentage (paper §4.1 / §4.2).
// - BPMNReflectionMode: the SelfReflection / CrossReflection / HumanReflection
//   subclasses flattened to an attribute enum; 'none' covers the optional case.
export type BPMNAgentRole = 'worker' | 'manager';

export type BPMNReflectionMode = 'none' | 'self' | 'cross' | 'human';

export const clampTrustScore = (n: number): number => Math.min(100, Math.max(0, Math.round(n)));
