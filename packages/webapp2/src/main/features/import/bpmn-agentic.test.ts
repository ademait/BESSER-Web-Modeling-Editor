import { describe, it, expect } from 'vitest';
import { clampTrustScore } from '@besser/wme';

// Phase D (04D) coverage for the SEAA'25 Agentic BPMN extension. Agentic lanes
// and tasks are the base BPMNSwimlane / BPMNTask with an `isAgentic` flag (04D
// pivot), so the model classes are exercised by the editor build's type-check;
// the pure trust-score clamp is the unit-testable surface reachable through
// @besser/wme (see .adem/CLAUDE.md test-infra caveats).

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
