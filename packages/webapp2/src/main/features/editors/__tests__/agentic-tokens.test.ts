import { describe, it, expect } from 'vitest';
import {
  AGENT_CATEGORY_TOKENS,
  AGENTIC_EDGE_KIND_TOKENS,
  HUMAN_ACTOR_TOKENS,
  isAgentStereotype,
  isAgenticEdgeStereotype,
  stereotypeTokens,
} from '../../../../../../editor/src/main/packages/common/agentic/agentic-tokens';

/**
 * Guards the Phase C (C-lite) agentic token contract. The token strings
 * mirror the BESSER metamodel enums in
 * uml_component/agentic.py — these tests fail if the WME side drifts.
 */
describe('Phase C — agentic token vocabulary', () => {
  it('AgentCategory tokens match the metamodel enum values', () => {
    expect([...AGENT_CATEGORY_TOKENS]).toEqual(['solution', 'supervision', 'consensus', 'collaboration']);
  });

  it('AgenticEdgeKind has the 8 metamodel tokens', () => {
    expect([...AGENTIC_EDGE_KIND_TOKENS]).toEqual([
      'delegates',
      'supervises',
      'revises',
      'collaborates',
      'has',
      'uses',
      'granted',
      'implements',
    ]);
  });

  it('HUMAN_ACTOR_TOKENS has the canonical `human` plus the `actor` alias', () => {
    expect([...HUMAN_ACTOR_TOKENS]).toEqual(['human', 'actor']);
  });

  it('stereotypeTokens splits on commas and whitespace, lowercased', () => {
    expect(stereotypeTokens('Solution, External')).toEqual(['solution', 'external']);
    expect(stereotypeTokens('  delegates   has ')).toEqual(['delegates', 'has']);
    expect(stereotypeTokens('')).toEqual([]);
    expect(stereotypeTokens(undefined)).toEqual([]);
  });

  it('isAgentStereotype is true for an AgentCategory or human-actor token', () => {
    expect(isAgentStereotype('solution')).toBe(true);
    expect(isAgentStereotype('supervision, external')).toBe(true);
    expect(isAgentStereotype('human')).toBe(true); // canonical human-actor
    expect(isAgentStereotype('actor')).toBe(true); // parse-side alias
    expect(isAgentStereotype('skill, human')).toBe(true); // human alone promotes
    expect(isAgentStereotype('skill')).toBe(false); // a capability, not an agent
    expect(isAgentStereotype('external')).toBe(false); // locality, not an agent
    expect(isAgentStereotype('')).toBe(false);
  });

  it('isAgenticEdgeStereotype is true only for an AgenticEdgeKind token', () => {
    expect(isAgenticEdgeStereotype('delegates')).toBe(true);
    expect(isAgenticEdgeStereotype('granted {permission: repo:write}')).toBe(true);
    expect(isAgenticEdgeStereotype('HTTPS')).toBe(false);
    expect(isAgenticEdgeStereotype('')).toBe(false);
  });
});
