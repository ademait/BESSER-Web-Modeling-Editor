import { describe, it, expect } from 'vitest';
import { BPMNAgenticLane, BPMNAgenticTask, clampTrustScore } from '@besser/wme';

// Phase D (04D) round-trip coverage for the SEAA'25 Agentic BPMN extension.
// Editor unit tests don't auto-run (see .adem/CLAUDE.md test-infra caveats), so
// this lives in webapp2 and reaches the model classes through the @besser/wme
// surface exported in D3.2.

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

describe('BPMNAgenticLane', () => {
  it('defaults role to worker and trust score to 0', () => {
    const lane = new BPMNAgenticLane();
    expect(lane.role).toBe('worker');
    expect(lane.trustScore).toBe(0);
  });

  it('round-trips role and trust score through serialize/deserialize', () => {
    const lane = new BPMNAgenticLane({ role: 'manager', trustScore: 80 });
    const serialized = lane.serialize();
    expect(serialized.role).toBe('manager');
    expect(serialized.trustScore).toBe(80);

    const restored = new BPMNAgenticLane();
    restored.deserialize(serialized);
    expect(restored.role).toBe('manager');
    expect(restored.trustScore).toBe(80);
  });

  it('clamps an out-of-range trust score at construction', () => {
    expect(new BPMNAgenticLane({ trustScore: 150 }).trustScore).toBe(100);
    expect(new BPMNAgenticLane({ trustScore: -10 }).trustScore).toBe(0);
  });
});

describe('BPMNAgenticTask', () => {
  it('defaults reflection mode to none and trust score to 0', () => {
    const task = new BPMNAgenticTask();
    expect(task.reflectionMode).toBe('none');
    expect(task.trustScore).toBe(0);
  });

  it('round-trips reflection mode and trust score through serialize/deserialize', () => {
    const task = new BPMNAgenticTask({ reflectionMode: 'cross', trustScore: 65 });
    const serialized = task.serialize();
    expect(serialized.reflectionMode).toBe('cross');
    expect(serialized.trustScore).toBe(65);

    const restored = new BPMNAgenticTask();
    restored.deserialize(serialized);
    expect(restored.reflectionMode).toBe('cross');
    expect(restored.trustScore).toBe(65);
  });

  it('clamps an out-of-range trust score at construction', () => {
    expect(new BPMNAgenticTask({ trustScore: 150 }).trustScore).toBe(100);
    expect(new BPMNAgenticTask({ trustScore: -10 }).trustScore).toBe(0);
  });
});
