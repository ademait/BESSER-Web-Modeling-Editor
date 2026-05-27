import { describe, it, expect } from 'vitest';
import type { UMLModel } from '@besser/wme';
import { bpmnModelToComponentModel } from '../bpmn-to-component';
import flatNoPools from './fixtures/flat-no-pools.json';
import singlePoolNoLanes from './fixtures/single-pool-no-lanes.json';
import minimalAgentic from './fixtures/minimal-agentic.json';
import gatewayRouted from './fixtures/gateway-routed.json';
import multiPoolMessage from './fixtures/multi-pool-message.json';

describe('Inter-diagram — bpmnModelToComponentModel', () => {
  describe('refusals', () => {
    it('refuses with `no-pools` on a flat BPMN', () => {
      const r = bpmnModelToComponentModel(flatNoPools as unknown as UMLModel);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe('no-pools');
    });

    it('refuses with `no-lanes-in-any-pool` when a pool has no lanes', () => {
      const r = bpmnModelToComponentModel(singlePoolNoLanes as unknown as UMLModel);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe('no-lanes-in-any-pool');
    });

    it('refuses on a non-BPMN model', () => {
      const r = bpmnModelToComponentModel({
        version: '3.0.0',
        type: 'ClassDiagram',
        size: { width: 800, height: 600 },
        elements: {},
        interactive: { elements: {}, relationships: {} },
        relationships: {},
        assessments: {},
      } as unknown as UMLModel);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe('not-a-bpmn-diagram');
    });
  });

  describe('minimal-agentic — manager → worker', () => {
    const r = bpmnModelToComponentModel(minimalAgentic as unknown as UMLModel);
    it('produces a ComponentDiagram model', () => {
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.model.type).toBe('ComponentDiagram');
      }
    });
    it('emits 1 Subsystem + 2 agent-Components (no skills, no has edges)', () => {
      if (!r.ok) throw new Error('expected ok');
      const els = Object.values(r.model.elements);
      expect(els.filter((e) => e.type === 'Subsystem')).toHaveLength(1);
      const components = els.filter((e) => e.type === 'Component');
      expect(components).toHaveLength(2);
      const solutions = components.filter((c) => (c as unknown as { stereotype?: string }).stereotype === 'solution');
      expect(solutions).toHaveLength(2);
    });
    it('emits exactly 1 `delegates` edge (no `has` edges)', () => {
      if (!r.ok) throw new Error('expected ok');
      const rels = Object.values(r.model.relationships);
      const stereotypes = rels.map((rel) => (rel as unknown as { stereotype?: string }).stereotype).sort();
      expect(stereotypes).toEqual(['delegates']);
    });
  });

  describe('gateway-routed — manager → leader-driven merging gateway → 2 workers', () => {
    const r = bpmnModelToComponentModel(gatewayRouted as unknown as UMLModel);
    it('emits 2 `supervises` edges (one per worker)', () => {
      if (!r.ok) throw new Error('expected ok');
      const rels = Object.values(r.model.relationships);
      const supervises = rels.filter((rel) => (rel as unknown as { stereotype?: string }).stereotype === 'supervises');
      expect(supervises).toHaveLength(2);
    });
  });

  describe('multi-pool-message — inter-pool message flow', () => {
    const r = bpmnModelToComponentModel(multiPoolMessage as unknown as UMLModel);
    it('emits an `external`-stereotyped Component', () => {
      if (!r.ok) throw new Error('expected ok');
      const externals = Object.values(r.model.elements).filter(
        (e) => (e as unknown as { stereotype?: string }).stereotype === 'external',
      );
      expect(externals.length).toBeGreaterThanOrEqual(1);
    });
    it('emits a `delegates` edge', () => {
      if (!r.ok) throw new Error('expected ok');
      const delegates = Object.values(r.model.relationships).filter(
        (rel) => (rel as unknown as { stereotype?: string }).stereotype === 'delegates',
      );
      expect(delegates.length).toBeGreaterThanOrEqual(1);
    });
    it('does NOT surface an `inferred-external-component` warning when target is a tracked lane', () => {
      if (!r.ok) throw new Error('expected ok');
      // F-D4 (2026-05-27): when the message-flow target resolves to a
      // tracked lane, we connect to that lane's existing Component
      // and do not synthesize an external (so we do not warn).
      expect(r.warnings.some((w) => w.kind === 'inferred-external-component')).toBe(false);
    });
  });

  describe('edge de-duplication', () => {
    it('two parallel manager→worker flows collapse to one `delegates` edge', () => {
      const model = JSON.parse(JSON.stringify(minimalAgentic));
      const existingFlow = Object.values(model.relationships).find(
        (rel: unknown) => (rel as { type?: string; flowType?: string }).type === 'BPMNFlow',
      ) as { id: string };
      if (!existingFlow) throw new Error('fixture should contain a sequence flow');
      const dup = { ...existingFlow, id: `${existingFlow.id}-dup` };
      model.relationships[dup.id] = dup;

      const r = bpmnModelToComponentModel(model as unknown as UMLModel);
      if (!r.ok) throw new Error('expected ok');
      const delegates = Object.values(r.model.relationships).filter(
        (rel) => (rel as unknown as { stereotype?: string }).stereotype === 'delegates',
      );
      expect(delegates).toHaveLength(1);
    });
  });
});
