import { describe, it, expect } from 'vitest';
import { clampTrustScore, mergingStrategiesFor } from '@besser/wme';

// Phase D coverage for the SEAA'25 Agentic BPMN extension:
// - 04D foundation: agentic lanes / tasks via `isAgentic` (04D pivot). Model
//   classes are exercised by the editor build's type-check; the pure
//   trust-score clamp is unit-testable through @besser/wme.
// - 04D1 collaboration: mergingStrategiesFor maps each CollaborationMode to
//   its valid strategy enum values, matching the paper's two-letter notation
//   (Table 2). Debate mode accepts both voting and role strategies per
//   paper §4.3 last paragraph.
// (See .claude/CLAUDE.md test-infra caveats.)

describe('clampTrustScore', () => {
  it('clamps below 0 and above 100', () => {
    expect(clampTrustScore(-10)).toBe(0);
    expect(clampTrustScore(150)).toBe(100);
  });
  it('passes in-range values through (rounded)', () => {
    expect(clampTrustScore(0)).toBe(0);
    expect(clampTrustScore(100)).toBe(100);
    expect(clampTrustScore(80)).toBe(80);
    expect(clampTrustScore(42.6)).toBe(43);
  });
});

describe('mergingStrategiesFor', () => {
  it('returns voting strategies for voting mode', () => {
    expect(mergingStrategiesFor('voting')).toEqual(['majority', 'absolute-majority', 'minority']);
  });
  it('returns role strategies for role mode', () => {
    expect(mergingStrategiesFor('role')).toEqual(['leader-driven', 'composed']);
  });
  it('returns competition strategies for competition mode', () => {
    expect(mergingStrategiesFor('competition')).toEqual(['fastest', 'most-complete']);
  });
  it('returns voting + role strategies for debate mode', () => {
    expect(mergingStrategiesFor('debate')).toEqual([
      'majority',
      'absolute-majority',
      'minority',
      'leader-driven',
      'composed',
    ]);
  });
});
