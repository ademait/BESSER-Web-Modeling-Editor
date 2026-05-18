import { describe, it, expect } from 'vitest';
import { clampTrustScore, mergingStrategiesFor } from '@besser/wme';
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
    expect(warnings).toEqual([]);

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
    expect(parGw?.mergingStrategy).toBe('leader-driven');
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
