import { describe, it, expect } from 'vitest';
import {
  clampTrustScore,
  mergingStrategiesFor,
  resolveUpstreamCollabMode,
  findDownstreamAgenticConstructs,
  findOrphanedMergingGateways,
} from '@besser/wme';
import type { UMLModel } from '@besser/wme';
import { apollonBpmnToXml } from '../export/bpmn-xml-exporter';
import { bpmnXmlToApollon } from './bpmn-xml-importer';

// Phase D coverage for the SEAA'25 Agentic BPMN extension:
// - 04D foundation: agentic lanes / tasks via `isAgentic` (04D pivot). Model
//   classes are exercised by the editor build's type-check; the pure
//   trust-score clamp is unit-testable through @besser/wme.
// - 04D1 collaboration: mergingStrategiesFor maps each CollaborationMode to
//   its valid strategy enum values, matching the paper's two-letter notation
//   (Table 2). Debate mode accepts both voting and role strategies per
//   paper §4.3 last paragraph.
// - 04D2 serialization: round-trip the agentic attributes through the BPMN
//   2.0 extension mechanism (paper §5, BPMN 2.0.2 § 8.2.3). Self-round-trip
//   in this editor; bpmn.io / Camunda Modeler silently drop the extensions
//   per BPMN spec — out of scope here.
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

describe('agentic round-trip (04D2)', () => {
  it('preserves agentic attributes through export → import', () => {
    const model = buildFixtureAgenticModel();
    const { xml } = apollonBpmnToXml(model);
    const { model: parsed, warnings } = bpmnXmlToApollon(xml);
    // The fixture intentionally has a merging gateway with no sequence-flow
    // upstream (it's a self-contained shape-collection, not a paper-valid
    // collaboration block). Post-04D2-followup-F3 flags it as orphaned — out
    // of scope for this round-trip-fidelity test. Filter the warning out.
    const filtered = warnings.filter((w) => w.code !== 'orphaned-merging-gateway');
    expect(filtered).toEqual([]);

    const findEl = (name: string): Record<string, unknown> | undefined =>
      Object.values(parsed.elements).find((e) => (e as { name?: string }).name === name) as
        | Record<string, unknown>
        | undefined;

    const lane = findEl('AgentReviewer');
    expect(lane?.isAgentic).toBe(true);
    expect(lane?.role).toBe('manager');
    expect(lane?.trustScore).toBe(90);

    const task = findEl('Review');
    expect(task?.isAgentic).toBe(true);
    expect(task?.reflectionMode).toBe('cross');
    expect(task?.trustScore).toBe(80);
    expect(task?.collaborationMode).toBe('debate');

    const parGw = findEl('AND');
    expect(parGw?.isAgentic).toBe(true);
    expect(parGw?.gatewayRole).toBe('diverging');
    expect(parGw?.collaborationMode).toBe('role');
    // Paper §4.3: merging strategy belongs to the merging gateway only.
    // Diverging gateway emits no mergingStrategy → field is at default on
    // re-import (irrelevant for diverging — see 04D2 follow-up).
    expect(parGw?.trustScore).toBe(75);

    const incGw = findEl('OR');
    expect(incGw?.isAgentic).toBe(true);
    expect(incGw?.gatewayRole).toBe('merging');
    expect(incGw?.collaborationMode).toBe('voting');
    expect(incGw?.mergingStrategy).toBe('absolute-majority');
    expect(incGw?.trustScore).toBe(60);

    const mf = Object.values(parsed.relationships).find((r) => (r as { flowType?: string }).flowType === 'message') as
      | Record<string, unknown>
      | undefined;
    expect(mf?.isAgentic).toBe(true);
    expect(mf?.collaborationMode).toBe('voting');
    expect(mf?.mergingStrategy).toBe('majority');
    expect(mf?.trustScore).toBe(50);
  });

  it('warns on a malformed trustScore and still loads the element', () => {
    const { xml } = apollonBpmnToXml(buildFixtureAgenticModel());
    // The agentic lane carries trustScore="90"; corrupt it.
    const corrupted = xml.replace('trustScore="90"', 'trustScore="bogus"');
    const { warnings, model } = bpmnXmlToApollon(corrupted);
    expect(warnings.some((w) => w.code === 'agentic-bad-trust-score')).toBe(true);
    const lane = Object.values(model.elements).find((e) => (e as { name?: string }).name === 'AgentReviewer');
    expect(lane).toBeDefined();
  });

  it('warns on an unknown enum value', () => {
    const { xml } = apollonBpmnToXml(buildFixtureAgenticModel());
    // The agentic task carries reflectionMode="cross"; corrupt to an unknown value.
    const corrupted = xml.replace('reflectionMode="cross"', 'reflectionMode="telepathy"');
    const { warnings } = bpmnXmlToApollon(corrupted);
    expect(warnings.some((w) => w.code === 'agentic-unknown-enum')).toBe(true);
  });

  it('non-agentic export contains no agentic extension blocks', () => {
    const baseModel = buildFixtureNonAgenticModel();
    const { xml } = apollonBpmnToXml(baseModel);
    expect(xml).toContain('xmlns:agentic=');
    expect(xml).not.toContain('<agentic:agentic');
    expect(xml).not.toContain('<bpmn:extensionElements>');
  });
});

describe('importer collab-mode derivation (04D2-followup F3)', () => {
  // Fixture: AND (diverging, role) → Task (agentic, stored debate) → OR
  // (merging, stored voting / absolute-majority). After import, both
  // downstream constructs should be aligned to AND's mode.
  function buildConnectedAgenticModel(): UMLModel {
    const bounds = (x: number, y: number, w: number, h: number) => ({ x, y, width: w, height: h });
    return {
      version: '3.0.0',
      type: 'BPMN' as UMLModel['type'],
      size: { width: 1000, height: 400 },
      interactive: { elements: {}, relationships: {} },
      assessments: {},
      elements: {
        Pool_1: {
          id: 'Pool_1',
          name: 'Project Repository',
          type: 'BPMNPool',
          owner: null,
          bounds: bounds(0, 0, 800, 300),
        },
        Lane_1: {
          id: 'Lane_1',
          name: 'AgentLane',
          type: 'BPMNSwimlane',
          owner: 'Pool_1',
          bounds: bounds(40, 0, 760, 300),
          isAgentic: true,
          role: 'manager',
          trustScore: 90,
        } as unknown as UMLModel['elements'][string],
        Gateway_AND: {
          id: 'Gateway_AND',
          name: 'AND',
          type: 'BPMNGateway',
          owner: 'Lane_1',
          bounds: bounds(80, 100, 40, 40),
          gatewayType: 'parallel',
          isAgentic: true,
          gatewayRole: 'diverging',
          collaborationMode: 'role',
          mergingStrategy: 'leader-driven',
          trustScore: 75,
        } as unknown as UMLModel['elements'][string],
        Task_1: {
          id: 'Task_1',
          name: 'Review',
          type: 'BPMNTask',
          owner: 'Lane_1',
          bounds: bounds(200, 90, 100, 60),
          taskType: 'user',
          marker: 'none',
          isAgentic: true,
          reflectionMode: 'cross',
          trustScore: 80,
          collaborationMode: 'debate', // stale — will be overridden to 'role'
        } as unknown as UMLModel['elements'][string],
        Gateway_OR: {
          id: 'Gateway_OR',
          name: 'OR',
          type: 'BPMNGateway',
          owner: 'Lane_1',
          bounds: bounds(380, 100, 40, 40),
          gatewayType: 'inclusive',
          isAgentic: true,
          gatewayRole: 'merging',
          collaborationMode: 'voting', // stale — will be overridden to 'role'
          mergingStrategy: 'absolute-majority', // invalid for 'role' — snap to 'leader-driven'
          trustScore: 60,
        } as unknown as UMLModel['elements'][string],
      },
      relationships: {
        SF_1: {
          id: 'SF_1',
          name: '',
          type: 'BPMNFlow',
          owner: null,
          bounds: bounds(120, 115, 80, 10),
          path: [
            { x: 0, y: 0 },
            { x: 80, y: 0 },
          ],
          source: { element: 'Gateway_AND', direction: 'Right' as never },
          target: { element: 'Task_1', direction: 'Left' as never },
          flowType: 'sequence',
        } as unknown as UMLModel['relationships'][string],
        SF_2: {
          id: 'SF_2',
          name: '',
          type: 'BPMNFlow',
          owner: null,
          bounds: bounds(300, 115, 80, 10),
          path: [
            { x: 0, y: 0 },
            { x: 80, y: 0 },
          ],
          source: { element: 'Task_1', direction: 'Right' as never },
          target: { element: 'Gateway_OR', direction: 'Left' as never },
          flowType: 'sequence',
        } as unknown as UMLModel['relationships'][string],
      },
    } as unknown as UMLModel;
  }

  it('overrides stale downstream collaborationMode with the upstream value', () => {
    const { xml } = apollonBpmnToXml(buildConnectedAgenticModel());
    const { model, warnings } = bpmnXmlToApollon(xml);

    const findEl = (name: string): Record<string, unknown> | undefined =>
      Object.values(model.elements).find((e) => (e as { name?: string }).name === name) as
        | Record<string, unknown>
        | undefined;

    const task = findEl('Review');
    expect(task?.collaborationMode).toBe('role'); // was 'debate' in fixture

    const orGw = findEl('OR');
    expect(orGw?.collaborationMode).toBe('role'); // was 'voting'
    expect(orGw?.mergingStrategy).toBe('leader-driven'); // snapped from 'absolute-majority'

    // OR has an upstream diverging gateway → not orphaned.
    expect(warnings.some((w) => w.code === 'orphaned-merging-gateway')).toBe(false);
  });

  it('aligns merging gateway type with upstream diverging type (O1 refinement)', () => {
    // Build the connected fixture and corrupt the OR's gatewayType to
    // 'inclusive' while AND stays 'parallel'. After import, the post-pass
    // should snap OR back to 'parallel'.
    const model = buildConnectedAgenticModel();
    (model.elements as Record<string, { id: string }>)['Gateway_OR'] = {
      ...(model.elements as Record<string, { id: string; type: string }>)['Gateway_OR'],
      gatewayType: 'inclusive', // mismatched — AND is parallel
    } as never;
    const { xml } = apollonBpmnToXml(model);
    const { model: parsed } = bpmnXmlToApollon(xml);
    const orGw = Object.values(parsed.elements).find((e) => (e as { name?: string }).name === 'OR') as
      | Record<string, unknown>
      | undefined;
    expect(orGw?.gatewayType).toBe('parallel');
  });

  it('emits orphaned-merging-gateway warning when no upstream diverging exists', () => {
    // Fixture from buildFixtureAgenticModel — it has Gateway_2 (OR, merging)
    // with no sequence-flow upstream. Reuse it and assert the warning fires.
    const { xml } = apollonBpmnToXml(buildFixtureAgenticModelForOrphan());
    const { warnings } = bpmnXmlToApollon(xml);
    expect(warnings.some((w) => w.code === 'orphaned-merging-gateway')).toBe(true);
  });

  // Minimal fixture: one merging gateway and nothing else upstream of it.
  function buildFixtureAgenticModelForOrphan(): UMLModel {
    const bounds = (x: number, y: number, w: number, h: number) => ({ x, y, width: w, height: h });
    return {
      version: '3.0.0',
      type: 'BPMN' as UMLModel['type'],
      size: { width: 400, height: 200 },
      interactive: { elements: {}, relationships: {} },
      assessments: {},
      elements: {
        Pool_1: {
          id: 'Pool_1',
          name: 'P',
          type: 'BPMNPool',
          owner: null,
          bounds: bounds(0, 0, 400, 200),
        },
        Gateway_OR: {
          id: 'Gateway_OR',
          name: 'OrphanOR',
          type: 'BPMNGateway',
          owner: 'Pool_1',
          bounds: bounds(80, 80, 40, 40),
          gatewayType: 'inclusive',
          isAgentic: true,
          gatewayRole: 'merging',
          collaborationMode: 'voting',
          mergingStrategy: 'majority',
          trustScore: 50,
        } as unknown as UMLModel['elements'][string],
      },
      relationships: {},
    } as unknown as UMLModel;
  }
});

// Build a minimal UMLModel with one of each agentic construct + supporting
// pools / lanes / flow. Coordinates are arbitrary — the agentic round-trip
// doesn't depend on geometry, only that the BPMN DI emits well-formed shapes.
function buildFixtureAgenticModel(): UMLModel {
  const bounds = (x: number, y: number, w: number, h: number) => ({ x, y, width: w, height: h });
  return {
    version: '3.0.0',
    type: 'BPMN' as UMLModel['type'],
    size: { width: 1000, height: 600 },
    interactive: { elements: {}, relationships: {} },
    assessments: {},
    elements: {
      Pool_1: {
        id: 'Pool_1',
        name: 'Project Repository',
        type: 'BPMNPool',
        owner: null,
        bounds: bounds(0, 0, 600, 300),
      },
      Pool_2: {
        id: 'Pool_2',
        name: 'External Tool',
        type: 'BPMNPool',
        owner: null,
        bounds: bounds(0, 400, 600, 100),
      },
      Lane_1: {
        id: 'Lane_1',
        name: 'AgentReviewer',
        type: 'BPMNSwimlane',
        owner: 'Pool_1',
        bounds: bounds(40, 0, 560, 300),
        isAgentic: true,
        role: 'manager',
        trustScore: 90,
      } as unknown as UMLModel['elements'][string],
      Task_1: {
        id: 'Task_1',
        name: 'Review',
        type: 'BPMNTask',
        owner: 'Lane_1',
        bounds: bounds(80, 40, 100, 60),
        taskType: 'user',
        marker: 'none',
        isAgentic: true,
        reflectionMode: 'cross',
        trustScore: 80,
        collaborationMode: 'debate',
      } as unknown as UMLModel['elements'][string],
      Gateway_1: {
        id: 'Gateway_1',
        name: 'AND',
        type: 'BPMNGateway',
        owner: 'Lane_1',
        bounds: bounds(220, 50, 40, 40),
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'role',
        mergingStrategy: 'leader-driven',
        trustScore: 75,
      } as unknown as UMLModel['elements'][string],
      Gateway_2: {
        id: 'Gateway_2',
        name: 'OR',
        type: 'BPMNGateway',
        owner: 'Lane_1',
        bounds: bounds(320, 50, 40, 40),
        gatewayType: 'inclusive',
        isAgentic: true,
        gatewayRole: 'merging',
        collaborationMode: 'voting',
        mergingStrategy: 'absolute-majority',
        trustScore: 60,
      } as unknown as UMLModel['elements'][string],
    },
    relationships: {
      MF_1: {
        id: 'MF_1',
        name: '',
        type: 'BPMNFlow',
        owner: null,
        bounds: bounds(300, 300, 10, 100),
        path: [
          { x: 0, y: 0 },
          { x: 0, y: 100 },
        ],
        source: { element: 'Pool_1', direction: 'Down' as never },
        target: { element: 'Pool_2', direction: 'Up' as never },
        flowType: 'message',
        isAgentic: true,
        collaborationMode: 'voting',
        mergingStrategy: 'majority',
        trustScore: 50,
      } as unknown as UMLModel['relationships'][string],
    },
  } as unknown as UMLModel;
}

// ─── 04D2-followup: collab-mode resolver + downstream walker (F1) ───────────
//
// The helpers operate on a *unified* `elementsById` map (elements + flows
// merged) — same shape `validateAllBpmnFlows` consumes after the 04C FB1 fix.
// Build helpers below produce that shape directly.

type AnyEl = { id: string; type: string; [k: string]: unknown };

function el(id: string, type: string, extra: Record<string, unknown> = {}): AnyEl {
  return { id, type, ...extra };
}

function seqFlow(id: string, sourceId: string, targetId: string): AnyEl {
  return {
    id,
    type: 'BPMNFlow',
    flowType: 'sequence',
    source: { element: sourceId },
    target: { element: targetId },
  };
}

describe('resolveUpstreamCollabMode (04D2-followup F1)', () => {
  it('walks one hop back to a diverging gateway', () => {
    const elementsById: Record<string, AnyEl> = {
      G1: el('G1', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'role',
      }),
      T1: el('T1', 'BPMNTask', { isAgentic: true }),
      F1: seqFlow('F1', 'G1', 'T1'),
    };
    expect(resolveUpstreamCollabMode('T1', elementsById)).toBe('role');
  });

  it('walks multiple hops back through non-agentic intermediaries', () => {
    const elementsById: Record<string, AnyEl> = {
      G1: el('G1', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'voting',
      }),
      T1: el('T1', 'BPMNTask'),
      T2: el('T2', 'BPMNTask', { isAgentic: true }),
      G2: el('G2', 'BPMNGateway', {
        gatewayType: 'inclusive',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      F1: seqFlow('F1', 'G1', 'T1'),
      F2: seqFlow('F2', 'T1', 'T2'),
      F3: seqFlow('F3', 'T2', 'G2'),
    };
    expect(resolveUpstreamCollabMode('G2', elementsById)).toBe('voting');
  });

  it('returns nearest diverging mode in nested collaboration blocks', () => {
    // outer (role) → middle task → inner diverging (voting) → inner task → inner merging
    // Inner task and inner merging must resolve to the INNER diverging (voting),
    // not the outer (role).
    const elementsById: Record<string, AnyEl> = {
      Gouter: el('Gouter', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'role',
      }),
      Tmid: el('Tmid', 'BPMNTask'),
      Ginner: el('Ginner', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'voting',
      }),
      Tinner: el('Tinner', 'BPMNTask', { isAgentic: true }),
      GinnerMerge: el('GinnerMerge', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      F1: seqFlow('F1', 'Gouter', 'Tmid'),
      F2: seqFlow('F2', 'Tmid', 'Ginner'),
      F3: seqFlow('F3', 'Ginner', 'Tinner'),
      F4: seqFlow('F4', 'Tinner', 'GinnerMerge'),
    };
    expect(resolveUpstreamCollabMode('Tinner', elementsById)).toBe('voting');
    expect(resolveUpstreamCollabMode('GinnerMerge', elementsById)).toBe('voting');
  });

  it('resolves outer merging to the OUTER diverging in nested blocks (O3 fix)', () => {
    // Gouter (role) → A → Ginner (voting) → B → GinnerMerge → C → GouterMerge
    // GouterMerge must inherit from Gouter (role), NOT Ginner (voting).
    const elementsById: Record<string, AnyEl> = {
      Gouter: el('Gouter', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'role',
      }),
      A: el('A', 'BPMNTask'),
      Ginner: el('Ginner', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'voting',
      }),
      B: el('B', 'BPMNTask', { isAgentic: true }),
      GinnerMerge: el('GinnerMerge', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      C: el('C', 'BPMNTask'),
      GouterMerge: el('GouterMerge', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      F1: seqFlow('F1', 'Gouter', 'A'),
      F2: seqFlow('F2', 'A', 'Ginner'),
      F3: seqFlow('F3', 'Ginner', 'B'),
      F4: seqFlow('F4', 'B', 'GinnerMerge'),
      F5: seqFlow('F5', 'GinnerMerge', 'C'),
      F6: seqFlow('F6', 'C', 'GouterMerge'),
    };
    expect(resolveUpstreamCollabMode('GouterMerge', elementsById)).toBe('role');
    // Inner merging still inherits from its own block.
    expect(resolveUpstreamCollabMode('GinnerMerge', elementsById)).toBe('voting');
    // Inner agentic task still inherits from its own block.
    expect(resolveUpstreamCollabMode('B', elementsById)).toBe('voting');
  });

  it('returns undefined when no upstream diverging gateway exists', () => {
    const elementsById: Record<string, AnyEl> = {
      Start: el('Start', 'BPMNStartEvent'),
      T1: el('T1', 'BPMNTask', { isAgentic: true }),
      F1: seqFlow('F1', 'Start', 'T1'),
    };
    expect(resolveUpstreamCollabMode('T1', elementsById)).toBeUndefined();
  });

  it('is cycle-safe (does not hang on cyclic graphs)', () => {
    const elementsById: Record<string, AnyEl> = {
      T1: el('T1', 'BPMNTask'),
      T2: el('T2', 'BPMNTask'),
      F1: seqFlow('F1', 'T1', 'T2'),
      F2: seqFlow('F2', 'T2', 'T1'),
    };
    expect(resolveUpstreamCollabMode('T2', elementsById)).toBeUndefined();
  });

  it('ignores non-sequence flows when walking', () => {
    // Message flow from a diverging gateway must NOT count as upstream sequence.
    const elementsById: Record<string, AnyEl> = {
      G1: el('G1', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'role',
      }),
      T1: el('T1', 'BPMNTask', { isAgentic: true }),
      MF: {
        id: 'MF',
        type: 'BPMNFlow',
        flowType: 'message',
        source: { element: 'G1' },
        target: { element: 'T1' },
      },
    };
    expect(resolveUpstreamCollabMode('T1', elementsById)).toBeUndefined();
  });
});

describe('findDownstreamAgenticConstructs (04D2-followup F1)', () => {
  it('collects agentic tasks and merging gateways downstream of a diverging gateway', () => {
    const elementsById: Record<string, AnyEl> = {
      G1: el('G1', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'role',
      }),
      Ta: el('Ta', 'BPMNTask', { isAgentic: true }),
      Tb: el('Tb', 'BPMNTask', { isAgentic: true }),
      Tc: el('Tc', 'BPMNTask'), // not agentic — excluded
      G2: el('G2', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      F1: seqFlow('F1', 'G1', 'Ta'),
      F2: seqFlow('F2', 'G1', 'Tb'),
      F3: seqFlow('F3', 'Ta', 'Tc'),
      F4: seqFlow('F4', 'Tb', 'G2'),
      F5: seqFlow('F5', 'Tc', 'G2'),
    };
    const result = findDownstreamAgenticConstructs('G1', elementsById);
    expect(result.taskIds.sort()).toEqual(['Ta', 'Tb']);
    expect(result.mergingGatewayIds).toEqual(['G2']);
  });

  it('stops at a nested diverging gateway (does not bleed into inner block)', () => {
    const elementsById: Record<string, AnyEl> = {
      Gouter: el('Gouter', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'role',
      }),
      Tmid: el('Tmid', 'BPMNTask', { isAgentic: true }),
      Ginner: el('Ginner', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'voting',
      }),
      Tinner: el('Tinner', 'BPMNTask', { isAgentic: true }),
      GinnerMerge: el('GinnerMerge', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      F1: seqFlow('F1', 'Gouter', 'Tmid'),
      F2: seqFlow('F2', 'Tmid', 'Ginner'),
      F3: seqFlow('F3', 'Ginner', 'Tinner'),
      F4: seqFlow('F4', 'Tinner', 'GinnerMerge'),
    };
    const result = findDownstreamAgenticConstructs('Gouter', elementsById);
    // Tmid is reachable; Ginner blocks further descent; Tinner / GinnerMerge belong to inner block.
    expect(result.taskIds).toEqual(['Tmid']);
    expect(result.mergingGatewayIds).toEqual([]);
  });

  it('jumps past a nested block to reach the outer merging (O3 fix, forward)', () => {
    // Gouter → A → Ginner → B → GinnerMerge → C → GouterMerge
    // Propagating from Gouter must collect GouterMerge but NOT B / GinnerMerge
    // (those belong to Ginner's block).
    const elementsById: Record<string, AnyEl> = {
      Gouter: el('Gouter', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'role',
      }),
      A: el('A', 'BPMNTask'),
      Ginner: el('Ginner', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'voting',
      }),
      B: el('B', 'BPMNTask', { isAgentic: true }),
      GinnerMerge: el('GinnerMerge', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      C: el('C', 'BPMNTask'),
      GouterMerge: el('GouterMerge', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      F1: seqFlow('F1', 'Gouter', 'A'),
      F2: seqFlow('F2', 'A', 'Ginner'),
      F3: seqFlow('F3', 'Ginner', 'B'),
      F4: seqFlow('F4', 'B', 'GinnerMerge'),
      F5: seqFlow('F5', 'GinnerMerge', 'C'),
      F6: seqFlow('F6', 'C', 'GouterMerge'),
    };
    const result = findDownstreamAgenticConstructs('Gouter', elementsById);
    expect(result.taskIds).toEqual([]); // B belongs to inner block, A/C non-agentic
    expect(result.mergingGatewayIds).toEqual(['GouterMerge']);
  });

  it('stops descending past the paired merging gateway', () => {
    // G1 → T1 → G2 (merging) → T2 (agentic) → G3 (merging)
    // Propagating from G1 must collect only G2 (the immediate paired merging),
    // not T2 or G3 (which belong to the next enclosing block, or are orphans).
    const elementsById: Record<string, AnyEl> = {
      G1: el('G1', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'role',
      }),
      T1: el('T1', 'BPMNTask', { isAgentic: true }),
      G2: el('G2', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      T2: el('T2', 'BPMNTask', { isAgentic: true }),
      G3: el('G3', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      F1: seqFlow('F1', 'G1', 'T1'),
      F2: seqFlow('F2', 'T1', 'G2'),
      F3: seqFlow('F3', 'G2', 'T2'),
      F4: seqFlow('F4', 'T2', 'G3'),
    };
    const result = findDownstreamAgenticConstructs('G1', elementsById);
    expect(result.taskIds).toEqual(['T1']);
    expect(result.mergingGatewayIds).toEqual(['G2']);
  });
});

describe('findOrphanedMergingGateways (04D2-followup F1)', () => {
  it('flags merging gateways with no upstream diverging gateway', () => {
    const elementsById: Record<string, AnyEl> = {
      Start: el('Start', 'BPMNStartEvent'),
      T1: el('T1', 'BPMNTask', { isAgentic: true }),
      Orphan: el('Orphan', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      F1: seqFlow('F1', 'Start', 'T1'),
      F2: seqFlow('F2', 'T1', 'Orphan'),
    };
    expect(findOrphanedMergingGateways(elementsById)).toEqual(['Orphan']);
  });

  it('does not flag merging gateways that have an upstream diverging gateway', () => {
    const elementsById: Record<string, AnyEl> = {
      G1: el('G1', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'role',
      }),
      T1: el('T1', 'BPMNTask', { isAgentic: true }),
      G2: el('G2', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'merging',
      }),
      F1: seqFlow('F1', 'G1', 'T1'),
      F2: seqFlow('F2', 'T1', 'G2'),
    };
    expect(findOrphanedMergingGateways(elementsById)).toEqual([]);
  });

  it('ignores non-agentic gateways and diverging gateways', () => {
    const elementsById: Record<string, AnyEl> = {
      Plain: el('Plain', 'BPMNGateway', { gatewayType: 'parallel' }),
      Diverging: el('Diverging', 'BPMNGateway', {
        gatewayType: 'parallel',
        isAgentic: true,
        gatewayRole: 'diverging',
        collaborationMode: 'role',
      }),
    };
    expect(findOrphanedMergingGateways(elementsById)).toEqual([]);
  });
});

function buildFixtureNonAgenticModel(): UMLModel {
  const bounds = (x: number, y: number, w: number, h: number) => ({ x, y, width: w, height: h });
  return {
    version: '3.0.0',
    type: 'BPMN' as UMLModel['type'],
    size: { width: 600, height: 300 },
    interactive: { elements: {}, relationships: {} },
    assessments: {},
    elements: {
      Pool_1: {
        id: 'Pool_1',
        name: 'Plain Pool',
        type: 'BPMNPool',
        owner: null,
        bounds: bounds(0, 0, 600, 200),
      },
      Lane_1: {
        id: 'Lane_1',
        name: 'Plain Lane',
        type: 'BPMNSwimlane',
        owner: 'Pool_1',
        bounds: bounds(40, 0, 560, 200),
      } as unknown as UMLModel['elements'][string],
      Task_1: {
        id: 'Task_1',
        name: 'Plain Task',
        type: 'BPMNTask',
        owner: 'Lane_1',
        bounds: bounds(80, 40, 100, 60),
        taskType: 'default',
        marker: 'none',
      } as unknown as UMLModel['elements'][string],
    },
    relationships: {},
  } as unknown as UMLModel;
}
