import { BPMNCollaborationMode, BPMNMergingStrategy } from './types';
import { findDownstreamAgenticConstructs, resolveUpstreamDivergingGateway } from '../bpmn-flow/bpmn-flow-validator';

// Duck-typed read-only view over the unified elements+flows map (same shape the
// FU1 walkers use — on the editor side this is Redux `state.elements`).
type AnyEl = {
  id: string;
  type: string;
  name?: string;
  owner?: string;
  isAgentic?: boolean;
  role?: string;
  trustScore?: number;
  gatewayRole?: string;
  collaborationMode?: BPMNCollaborationMode;
  mergingStrategy?: BPMNMergingStrategy;
};

// govdsl FLOAT requires a decimal point ([0-9]+ '.' [0-9]+) — always emit 2 dp.
const float2 = (n: number): string => n.toFixed(2);

// govdsl ID = [a-zA-Z_][a-zA-Z0-9_/-]*  (spec §4.5). BPMN names allow spaces /
// punctuation; collapse the rest to '_', prefix '_' if it can't lead an ID.
function sanitizeId(raw: string | undefined, fallback: string): string {
  const base = (raw ?? '').trim();
  if (!base) return fallback;
  let s = base.replace(/[^a-zA-Z0-9_/-]/g, '_');
  if (!/^[a-zA-Z_]/.test(s)) s = '_' + s;
  return s || fallback;
}

type PolicyType = 'MajorityPolicy' | 'AbsoluteMajorityPolicy' | 'LeaderDrivenPolicy' | 'VotingPolicy';
interface PolicyChoice {
  policyType: PolicyType;
  ratio?: number; // undefined → no Parameters block (leader-driven)
  todo?: string; // placeholder note for the unmapped strategies
}

// Spec §3 — mergingStrategy-primary. ratio is a FIXED default, not trust-derived.
function policyFor(strategy: BPMNMergingStrategy | undefined): PolicyChoice {
  switch (strategy) {
    case 'majority':
      return { policyType: 'MajorityPolicy', ratio: 0.5 };
    case 'absolute-majority':
      return { policyType: 'AbsoluteMajorityPolicy', ratio: 0.5 };
    case 'minority':
      return { policyType: 'MajorityPolicy', ratio: 0.4 };
    case 'leader-driven':
      return { policyType: 'LeaderDrivenPolicy' };
    case 'composed':
      return {
        policyType: 'VotingPolicy',
        ratio: 0.5,
        todo: "'composed' has no direct mapping — define a ComposedPolicy (Phases) manually.",
      };
    case 'fastest':
    case 'most-complete':
      return {
        policyType: 'VotingPolicy',
        ratio: 0.5,
        todo: `'${strategy}' (competition) has no direct governance policy; VotingPolicy placeholder — replace with the intended policy.`,
      };
    default:
      return { policyType: 'VotingPolicy', ratio: 0.5 };
  }
}

/**
 * Generate a starter Governance-DSL (.gov) instance for an agentic *merging*
 * gateway, per `.claude/governance-dsl/01-mapping-spec.md`. Pure: reads the
 * unified elements map, returns a string. The caller persists it onto the
 * gateway's `governanceDsl` field.
 */
export function generateGovernanceDsl(mergingGatewayId: string, elementsById: Record<string, AnyEl>): string {
  const gw = elementsById[mergingGatewayId];
  const mode = (gw?.collaborationMode ?? 'voting') as BPMNCollaborationMode;
  const strategy = gw?.mergingStrategy as BPMNMergingStrategy | undefined;
  const trust = typeof gw?.trustScore === 'number' ? gw.trustScore : 0;
  const choice = policyFor(strategy);

  // Scope = the merging gateway itself (the one-per-block anchor). Spec §4.1.
  const scopeId = sanitizeId(gw?.name, `MergeDecision_${mergingGatewayId.slice(0, 8)}`);
  const policyId = `${scopeId}Policy`;

  // Participants = the agentic lanes (agents) of the collaboration block. Spec
  // §4.2 — walk forward from the bounding diverging gateway, map each agentic
  // task to its owning lane, dedupe.
  const lanes = new Map<string, AnyEl>();
  const diverging = resolveUpstreamDivergingGateway(mergingGatewayId, elementsById);
  if (diverging) {
    const { taskIds } = findDownstreamAgenticConstructs(diverging.id, elementsById);
    for (const tid of taskIds) {
      const laneId = elementsById[tid]?.owner;
      if (laneId && elementsById[laneId]) lanes.set(laneId, elementsById[laneId]);
    }
  }

  const agents: { id: string; confidence: string; role?: string }[] = [];
  const roles = new Set<string>();
  for (const lane of lanes.values()) {
    const role = lane.role === 'manager' || lane.role === 'worker' ? lane.role : undefined;
    if (role) roles.add(role);
    agents.push({
      id: sanitizeId(lane.name, `Agent_${lane.id.slice(0, 8)}`),
      confidence: float2((typeof lane.trustScore === 'number' ? lane.trustScore : 0) / 100),
      role,
    });
  }
  const hasAgents = agents.length > 0;

  // ── assemble ──
  const L: string[] = [];
  L.push(`// Generated from agentic merging gateway "${gw?.name ?? mergingGatewayId}"`);
  L.push(`// collaborationMode=${mode}, mergingStrategy=${strategy ?? 'n/a'}, trustScore=${trust}`);
  if (choice.todo) L.push(`// TODO: ${choice.todo}`);

  L.push('Scopes:');
  L.push('    Tasks:');
  L.push(`        ${scopeId}`);

  L.push('Participants:');
  if (hasAgents) {
    if (roles.size > 0) L.push(`    Roles : ${Array.from(roles).join(', ')}`);
    L.push('    Individuals :');
    agents.forEach((a, i) => {
      const attrs = [`confidence : ${a.confidence}`];
      if (a.role) attrs.push(`role : ${a.role}`);
      L.push(`        (Agent) ${a.id} { ${attrs.join(', ')} }${i < agents.length - 1 ? ',' : ''}`);
    });
  } else {
    // Validity fallback (spec §4.2): govdsl requires a non-empty participant set.
    L.push('    Roles : participant');
    L.push('    // TODO: no agentic lanes found in the block — replace this placeholder.');
  }

  const participantList = hasAgents ? agents.map((a) => a.id).join(', ') : 'participant';
  L.push(`${choice.policyType} ${policyId} {`);
  L.push(`    Scope: ${scopeId}`);
  L.push('    DecisionType as BooleanDecision');
  L.push(`    Participant list : ${participantList}`);
  if (choice.ratio !== undefined) {
    L.push('    Parameters:');
    L.push(`        ratio : ${choice.ratio}`);
  }
  L.push('}');
  return L.join('\n');
}
