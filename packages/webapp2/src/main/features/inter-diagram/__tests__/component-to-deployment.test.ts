import { describe, it, expect } from 'vitest';
import type { UMLModel } from '@besser/wme';
import { componentModelToDeploymentModel } from '../component-to-deployment';

function makeBaseModel(): UMLModel {
  return {
    version: '3.0.0',
    type: 'ComponentDiagram',
    size: { width: 800, height: 600 },
    elements: {},
    interactive: { elements: {}, relationships: {} },
    relationships: {},
    assessments: {},
  } as unknown as UMLModel;
}

function el(
  id: string,
  type: string,
  name: string,
  owner: string | null,
  stereotype?: string,
): Record<string, unknown> {
  return {
    id,
    name,
    type,
    owner,
    bounds: { x: 0, y: 0, width: 100, height: 60 },
    stereotype: stereotype ?? (type === 'Component' ? 'component' : type === 'Subsystem' ? 'subsystem' : ''),
    displayStereotype: true,
  };
}

function dep(id: string, srcId: string, tgtId: string, stereotype?: string): Record<string, unknown> {
  return {
    id,
    name: '',
    type: 'ComponentDependency',
    owner: null,
    bounds: { x: 0, y: 0, width: 100, height: 60 },
    path: [],
    source: { element: srcId, direction: 'Right' },
    target: { element: tgtId, direction: 'Left' },
    ...(stereotype ? { stereotype } : {}),
  };
}

describe('Inter-diagram — componentModelToDeploymentModel', () => {
  describe('refusals', () => {
    it('refuses on a non-Component model', () => {
      const m = makeBaseModel();
      (m as unknown as { type: string }).type = 'BPMN';
      const r = componentModelToDeploymentModel(m);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe('not-a-component-diagram');
    });

    it('refuses on an empty Component diagram', () => {
      const r = componentModelToDeploymentModel(makeBaseModel());
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe('no-components');
    });
  });

  describe('minimal-2-subsystems-1-edge', () => {
    const m = makeBaseModel();
    Object.assign(m.elements as Record<string, unknown>, {
      s1: el('s1', 'Subsystem', 'Order', null),
      s2: el('s2', 'Subsystem', 'Shipping', null),
      c1: el('c1', 'Component', 'OrderAgent', 's1', 'solution'),
      c2: el('c2', 'Component', 'ShippingAgent', 's2', 'solution'),
    });
    Object.assign(m.relationships as Record<string, unknown>, {
      r1: dep('r1', 'c1', 'c2', 'delegates'),
    });
    const r = componentModelToDeploymentModel(m);

    it('produces a DeploymentDiagram model', () => {
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.model.type).toBe('DeploymentDiagram');
    });
    it('emits 2 DeploymentNodes (no Default Host)', () => {
      if (!r.ok) throw new Error('expected ok');
      const els = Object.values(r.model.elements);
      const nodes = els.filter((e) => e.type === 'DeploymentNode');
      expect(nodes).toHaveLength(2);
      const names = nodes.map((n) => n.name).sort();
      expect(names).toEqual(['Order', 'Shipping']);
      expect(nodes.find((n) => n.name === 'Default Host')).toBeUndefined();
    });
    it('emits 2 DeploymentComponents, one per Node', () => {
      if (!r.ok) throw new Error('expected ok');
      const dcs = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentComponent');
      expect(dcs).toHaveLength(2);
    });
    it('04-FU1 — emits 2 DeploymentArtifacts (one per Component), inside the same Node', () => {
      if (!r.ok) throw new Error('expected ok');
      const artifacts = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentArtifact');
      expect(artifacts).toHaveLength(2);
      const nodeIds = new Set(
        Object.values(r.model.elements)
          .filter((e) => e.type === 'DeploymentNode')
          .map((n) => n.id),
      );
      expect(artifacts.every((a) => nodeIds.has(a.owner ?? ''))).toBe(true);
    });
    it('04-FU1 — emits 1 structural DeploymentAssociation (no stereotype) cross-Node', () => {
      if (!r.ok) throw new Error('expected ok');
      const structural = Object.values(r.model.relationships).filter(
        (rel) =>
          rel.type === 'DeploymentAssociation' && (rel as unknown as { stereotype?: string }).stereotype === undefined,
      );
      expect(structural).toHaveLength(1);
    });
    it('04-FU1 — emits 2 «manifest» DeploymentAssociations (one per Artifact→Component pair)', () => {
      if (!r.ok) throw new Error('expected ok');
      const manifest = Object.values(r.model.relationships).filter(
        (rel) =>
          rel.type === 'DeploymentAssociation' && (rel as unknown as { stereotype?: string }).stereotype === 'manifest',
      );
      expect(manifest).toHaveLength(2);
    });
    it('emits no warnings', () => {
      if (!r.ok) throw new Error('expected ok');
      expect(r.warnings).toEqual([]);
    });
  });

  describe('flat-scaffold — no Subsystems', () => {
    const m = makeBaseModel();
    Object.assign(m.elements as Record<string, unknown>, {
      c1: el('c1', 'Component', 'A', null),
      c2: el('c2', 'Component', 'B', null),
      c3: el('c3', 'Component', 'C', null),
    });
    const r = componentModelToDeploymentModel(m);

    it('emits exactly 1 Default Host Node + 3 DeploymentComponents inside it', () => {
      if (!r.ok) throw new Error('expected ok');
      const nodes = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentNode');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].name).toBe('Default Host');
      const dcs = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentComponent');
      expect(dcs).toHaveLength(3);
      const hostId = nodes[0].id;
      expect(dcs.every((dc) => dc.owner === hostId)).toBe(true);
    });
    it('Default Host has displayStereotype: true (04-FU1 — consistency with other Nodes)', () => {
      if (!r.ok) throw new Error('expected ok');
      const host = Object.values(r.model.elements).find((e) => e.type === 'DeploymentNode')!;
      expect((host as unknown as { displayStereotype?: boolean }).displayStereotype).toBe(true);
    });
    it('emits exactly the `flat-scaffold` warning', () => {
      if (!r.ok) throw new Error('expected ok');
      expect(r.warnings).toEqual([{ kind: 'flat-scaffold' }]);
    });
  });

  describe('intra-subsystem-collapse — silent', () => {
    const m = makeBaseModel();
    Object.assign(m.elements as Record<string, unknown>, {
      s1: el('s1', 'Subsystem', 'Order', null),
      c1: el('c1', 'Component', 'Receiver', 's1'),
      c2: el('c2', 'Component', 'Validator', 's1'),
    });
    Object.assign(m.relationships as Record<string, unknown>, {
      r1: dep('r1', 'c1', 'c2'),
    });
    const r = componentModelToDeploymentModel(m);

    it('emits 1 Node, 2 DeploymentComponents, 0 STRUCTURAL associations, 0 warnings', () => {
      if (!r.ok) throw new Error('expected ok');
      const nodes = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentNode');
      const dcs = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentComponent');
      const structural = Object.values(r.model.relationships).filter(
        (rel) =>
          rel.type === 'DeploymentAssociation' && (rel as unknown as { stereotype?: string }).stereotype === undefined,
      );
      expect(nodes).toHaveLength(1);
      expect(dcs).toHaveLength(2);
      expect(structural).toHaveLength(0);
      expect(r.warnings).toEqual([]);
    });
    it('04-FU1 — still emits 2 «manifest» edges (one per Component-Artifact pair)', () => {
      if (!r.ok) throw new Error('expected ok');
      const manifest = Object.values(r.model.relationships).filter(
        (rel) =>
          rel.type === 'DeploymentAssociation' && (rel as unknown as { stereotype?: string }).stereotype === 'manifest',
      );
      expect(manifest).toHaveLength(2);
    });
  });

  describe('agentic-edge-dropped — silent', () => {
    const m = makeBaseModel();
    Object.assign(m.elements as Record<string, unknown>, {
      s1: el('s1', 'Subsystem', 'A', null),
      s2: el('s2', 'Subsystem', 'B', null),
      c1: el('c1', 'Component', 'Manager', 's1', 'solution'),
      c2: el('c2', 'Component', 'Worker', 's2', 'solution'),
    });
    Object.assign(m.relationships as Record<string, unknown>, {
      r1: dep('r1', 'c1', 'c2', 'delegates'),
    });
    const r = componentModelToDeploymentModel(m);

    it('emits 1 STRUCTURAL DeploymentAssociation with no stereotype and 0 warnings', () => {
      if (!r.ok) throw new Error('expected ok');
      const structural = Object.values(r.model.relationships).filter(
        (rel) =>
          rel.type === 'DeploymentAssociation' && (rel as unknown as { stereotype?: string }).stereotype === undefined,
      );
      expect(structural).toHaveLength(1);
      expect(r.warnings).toEqual([]);
    });
  });

  describe('nested-subsystems-flatten (OQ-1)', () => {
    const m = makeBaseModel();
    // A contains B contains C; D is orphan; dep D→C.
    Object.assign(m.elements as Record<string, unknown>, {
      sa: el('sa', 'Subsystem', 'A', null),
      sb: el('sb', 'Subsystem', 'B', 'sa'),
      c: el('c', 'Component', 'C', 'sb'),
      d: el('d', 'Component', 'D', null),
    });
    Object.assign(m.relationships as Record<string, unknown>, {
      r1: dep('r1', 'd', 'c'),
    });
    const r = componentModelToDeploymentModel(m);

    it('emits Nodes A and B as siblings under root, plus Default Host', () => {
      if (!r.ok) throw new Error('expected ok');
      const nodes = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentNode');
      expect(nodes).toHaveLength(3);
      // Every Node has owner === null (siblings under diagram root).
      expect(nodes.every((n) => n.owner === null)).toBe(true);
      const names = nodes.map((n) => n.name).sort();
      expect(names).toEqual(['A', 'B', 'Default Host']);
    });
    it('places Component C in Node B (immediate Subsystem parent, not A)', () => {
      if (!r.ok) throw new Error('expected ok');
      const nodeB = Object.values(r.model.elements).find((e) => e.type === 'DeploymentNode' && e.name === 'B')!;
      const dcC = Object.values(r.model.elements).find((e) => e.type === 'DeploymentComponent' && e.name === 'C')!;
      expect(dcC.owner).toBe(nodeB.id);
    });
    it('emits 1 STRUCTURAL DeploymentAssociation Default Host → B', () => {
      if (!r.ok) throw new Error('expected ok');
      const structural = Object.values(r.model.relationships).filter(
        (rel) =>
          rel.type === 'DeploymentAssociation' && (rel as unknown as { stereotype?: string }).stereotype === undefined,
      );
      expect(structural).toHaveLength(1);
    });
  });
});
