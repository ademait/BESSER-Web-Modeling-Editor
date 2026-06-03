import { describe, it, expect } from 'vitest';
import type { UMLModel } from '@besser/wme';
import { bpmnModelToComponentModel } from '../bpmn-to-component';
import flatNoPools from './fixtures/flat-no-pools.json';
import singlePoolNoLanes from './fixtures/single-pool-no-lanes.json';
import minimalAgentic from './fixtures/minimal-agentic.json';
import gatewayRouted from './fixtures/gateway-routed.json';
import multiPoolMessage from './fixtures/multi-pool-message.json';
import divergeMerge from './fixtures/diverge-merge.json';
import poolMessage from './fixtures/pool-message.json';

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

  describe('diverge-then-merge — surfaces supervises + revises + delegates (guide 13/14)', () => {
    const r = bpmnModelToComponentModel(divergeMerge as unknown as UMLModel);

    it('produces a ComponentDiagram with 1 Subsystem + 3 Components', () => {
      if (!r.ok) throw new Error('expected ok');
      const els = Object.values(r.model.elements);
      expect(els.filter((e) => e.type === 'Subsystem')).toHaveLength(1);
      expect(els.filter((e) => e.type === 'Component')).toHaveLength(3);
    });

    it('marks the two agentic lanes `solution` and the non-agentic lane `human`', () => {
      if (!r.ok) throw new Error('expected ok');
      const comps = Object.values(r.model.elements)
        .filter((e) => e.type === 'Component')
        .map((c) => (c as unknown as { stereotype?: string }).stereotype)
        .sort();
      expect(comps).toEqual(['human', 'solution', 'solution']);
    });

    it('emits exactly one delegates + one revises + one supervises edge', () => {
      if (!r.ok) throw new Error('expected ok');
      const stereotypes = Object.values(r.model.relationships)
        .map((rel) => (rel as unknown as { stereotype?: string }).stereotype)
        .sort();
      expect(stereotypes).toEqual(['delegates', 'revises', 'supervises']);
    });

    it('does NOT emit a spurious worker→Maintainer edge (cause (a) regression)', () => {
      if (!r.ok) throw new Error('expected ok');
      const byId = r.model.elements;
      const maintainer = Object.values(byId).find(
        (e) => (e as unknown as { stereotype?: string }).stereotype === 'human',
      );
      const coder = Object.values(byId).find((e) => e.type === 'Component' && e.name === 'Coder');
      expect(maintainer).toBeDefined();
      expect(coder).toBeDefined();
      const coderToMaintainer = Object.values(r.model.relationships).some(
        (rel) =>
          (rel as unknown as { source: { element: string } }).source.element === coder!.id &&
          (rel as unknown as { target: { element: string } }).target.element === maintainer!.id,
      );
      expect(coderToMaintainer).toBe(false);
    });
  });

  describe('pool-connected message flows target the Subsystem (14-FU2 / M9a+c)', () => {
    const r = bpmnModelToComponentModel(poolMessage as unknown as UMLModel);

    it('emits 3 Subsystems incl. a synthesised external for the laneless pool', () => {
      if (!r.ok) throw new Error('expected ok');
      const subs = Object.values(r.model.elements).filter((e) => e.type === 'Subsystem');
      expect(subs).toHaveLength(3);
      expect(subs.map((s) => s.name).sort()).toEqual(['LegacySystem', 'SwarmA', 'SwarmB']);
    });

    it('does NOT emit any external-stereotyped Component (pools are Subsystems)', () => {
      if (!r.ok) throw new Error('expected ok');
      const externalComps = Object.values(r.model.elements).filter(
        (e) => e.type === 'Component' && (e as unknown as { stereotype?: string }).stereotype === 'external',
      );
      expect(externalComps).toHaveLength(0);
    });

    it('routes a pool→pool message flow as Subsystem → Subsystem', () => {
      if (!r.ok) throw new Error('expected ok');
      const edge = Object.values(r.model.relationships).find((rel) => r.elementMapping[rel.id] === 'mf-1');
      expect(edge).toBeDefined();
      const src = r.model.elements[(edge as unknown as { source: { element: string } }).source.element];
      const tgt = r.model.elements[(edge as unknown as { target: { element: string } }).target.element];
      expect(src.type).toBe('Subsystem');
      expect(tgt.type).toBe('Subsystem');
      expect((edge as unknown as { stereotype?: string }).stereotype).toBe('delegates');
    });

    it('routes a lane→black-box-pool message flow as Component → Subsystem', () => {
      if (!r.ok) throw new Error('expected ok');
      const edge = Object.values(r.model.relationships).find((rel) => r.elementMapping[rel.id] === 'mf-2');
      expect(edge).toBeDefined();
      const src = r.model.elements[(edge as unknown as { source: { element: string } }).source.element];
      const tgt = r.model.elements[(edge as unknown as { target: { element: string } }).target.element];
      expect(src.type).toBe('Component');
      expect(tgt.type).toBe('Subsystem');
      expect(tgt.name).toBe('LegacySystem');
    });
  });

  describe('06-v2 — element-mapping output', () => {
    it('maps derived Subsystem → source Pool, Component → source Lane, ComponentDependency → source BPMNFlow', () => {
      const r = bpmnModelToComponentModel(minimalAgentic as unknown as UMLModel);
      if (!r.ok) throw new Error('expected ok');

      // Pull source ids from the fixture.
      const sourcePoolId = Object.values((minimalAgentic as unknown as UMLModel).elements).find(
        (e) => e.type === 'BPMNPool',
      )?.id;
      const sourceLaneIds = Object.values((minimalAgentic as unknown as UMLModel).elements)
        .filter((e) => e.type === 'BPMNSwimlane')
        .map((e) => e.id);
      const sourceFlowId = Object.values((minimalAgentic as unknown as UMLModel).relationships).find(
        (rel) => rel.type === 'BPMNFlow' && (rel as unknown as { flowType?: string }).flowType === 'sequence',
      )?.id;
      expect(sourcePoolId).toBeDefined();
      expect(sourceLaneIds.length).toBeGreaterThan(0);
      expect(sourceFlowId).toBeDefined();

      // The Subsystem points at the Pool.
      const subsystem = Object.values(r.model.elements).find((e) => e.type === 'Subsystem');
      expect(subsystem).toBeDefined();
      expect(r.elementMapping[subsystem!.id]).toBe(sourcePoolId);

      // Each lane-derived Component points at its source Lane.
      const components = Object.values(r.model.elements).filter((e) => e.type === 'Component');
      const mappedLaneIds = components.map((c) => r.elementMapping[c.id]).filter(Boolean);
      for (const mid of mappedLaneIds) {
        expect(sourceLaneIds).toContain(mid);
      }

      // The emitted ComponentDependency points at the source BPMNFlow.
      const dep = Object.values(r.model.relationships).find((rel) => rel.type === 'ComponentDependency');
      expect(dep).toBeDefined();
      expect(r.elementMapping[dep!.id]).toBe(sourceFlowId);
    });
  });
});
