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
    it('04-FU3 — emits 2 DeploymentComponents OUTSIDE the Nodes (owner=null)', () => {
      if (!r.ok) throw new Error('expected ok');
      const dcs = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentComponent');
      expect(dcs).toHaveLength(2);
      expect(dcs.every((d) => d.owner === null)).toBe(true);
    });
    it('04-FU3 — emits 2 DeploymentArtifacts INSIDE the matching Nodes (owner=nodeId)', () => {
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
    it('04-FU3 — emits 1 structural DeploymentAssociation cross-Node', () => {
      if (!r.ok) throw new Error('expected ok');
      const structural = Object.values(r.model.relationships).filter((rel) => rel.type === 'DeploymentAssociation');
      expect(structural).toHaveLength(1);
    });
    it('04-FU3 — emits 2 DeploymentDependencies (manifest, dashed) — no stereotype label', () => {
      if (!r.ok) throw new Error('expected ok');
      const manifests = Object.values(r.model.relationships).filter((rel) => rel.type === 'DeploymentDependency');
      expect(manifests).toHaveLength(2);
      expect(manifests.every((m) => (m as unknown as { stereotype?: string }).stereotype === undefined)).toBe(true);
    });
    it('04-FU3 — each manifest edge runs Artifact (source) → Component (target)', () => {
      if (!r.ok) throw new Error('expected ok');
      const manifests = Object.values(r.model.relationships).filter((rel) => rel.type === 'DeploymentDependency');
      const artifactIds = new Set(
        Object.values(r.model.elements)
          .filter((e) => e.type === 'DeploymentArtifact')
          .map((a) => a.id),
      );
      const componentIds = new Set(
        Object.values(r.model.elements)
          .filter((e) => e.type === 'DeploymentComponent')
          .map((c) => c.id),
      );
      for (const m of manifests) {
        expect(artifactIds.has(m.source.element)).toBe(true);
        expect(componentIds.has(m.target.element)).toBe(true);
      }
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

    it('04-FU3 — emits 1 Default Host Node + 3 DeploymentComponents OUTSIDE it (owner=null) + 3 Artifacts inside', () => {
      if (!r.ok) throw new Error('expected ok');
      const nodes = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentNode');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].name).toBe('Default Host');
      const dcs = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentComponent');
      expect(dcs).toHaveLength(3);
      expect(dcs.every((dc) => dc.owner === null)).toBe(true);
      const artifacts = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentArtifact');
      expect(artifacts).toHaveLength(3);
      const hostId = nodes[0].id;
      expect(artifacts.every((a) => a.owner === hostId)).toBe(true);
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

    it('emits 1 Node, 2 DeploymentComponents (owner=null), 0 STRUCTURAL associations, 0 warnings', () => {
      if (!r.ok) throw new Error('expected ok');
      const nodes = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentNode');
      const dcs = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentComponent');
      const structural = Object.values(r.model.relationships).filter((rel) => rel.type === 'DeploymentAssociation');
      expect(nodes).toHaveLength(1);
      expect(dcs).toHaveLength(2);
      expect(dcs.every((d) => d.owner === null)).toBe(true);
      expect(structural).toHaveLength(0);
      expect(r.warnings).toEqual([]);
    });
    it('04-FU3 — still emits 2 manifest DeploymentDependencies (one per Component-Artifact pair)', () => {
      if (!r.ok) throw new Error('expected ok');
      const manifest = Object.values(r.model.relationships).filter((rel) => rel.type === 'DeploymentDependency');
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
      const structural = Object.values(r.model.relationships).filter((rel) => rel.type === 'DeploymentAssociation');
      expect(structural).toHaveLength(1);
      expect((structural[0] as unknown as { stereotype?: string }).stereotype).toBeUndefined();
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
    it('04-FU3 — Component C lives above Node B (owner=null, its Artifact has owner=Node B)', () => {
      if (!r.ok) throw new Error('expected ok');
      const nodeB = Object.values(r.model.elements).find((e) => e.type === 'DeploymentNode' && e.name === 'B')!;
      const dcC = Object.values(r.model.elements).find((e) => e.type === 'DeploymentComponent' && e.name === 'C')!;
      expect(dcC.owner).toBeNull();
      const artifactC = Object.values(r.model.elements).find((e) => e.type === 'DeploymentArtifact' && e.name === 'C')!;
      expect(artifactC.owner).toBe(nodeB.id);
    });
    it('emits 1 STRUCTURAL DeploymentAssociation Default Host → B', () => {
      if (!r.ok) throw new Error('expected ok');
      const structural = Object.values(r.model.relationships).filter((rel) => rel.type === 'DeploymentAssociation');
      expect(structural).toHaveLength(1);
    });
  });

  describe('04-FU2 — Subsystem-to-Subsystem dependency', () => {
    const m = makeBaseModel();
    Object.assign(m.elements as Record<string, unknown>, {
      s1: el('s1', 'Subsystem', 'Order', null),
      s2: el('s2', 'Subsystem', 'Shipping', null),
      c1: el('c1', 'Component', 'Inner1', 's1'),
      c2: el('c2', 'Component', 'Inner2', 's2'),
    });
    // Dep at the Subsystem level (not between Components).
    Object.assign(m.relationships as Record<string, unknown>, {
      r1: dep('r1', 's1', 's2'),
    });
    const r = componentModelToDeploymentModel(m);

    it('emits 1 STRUCTURAL DeploymentAssociation between the two Nodes (FU2 fix)', () => {
      if (!r.ok) throw new Error('expected ok');
      const structural = Object.values(r.model.relationships).filter((rel) => rel.type === 'DeploymentAssociation');
      expect(structural).toHaveLength(1);
      const nodeOrder = Object.values(r.model.elements).find((e) => e.type === 'DeploymentNode' && e.name === 'Order')!;
      const nodeShipping = Object.values(r.model.elements).find(
        (e) => e.type === 'DeploymentNode' && e.name === 'Shipping',
      )!;
      const e = structural[0] as unknown as {
        source: { element: string };
        target: { element: string };
      };
      expect(e.source.element).toBe(nodeOrder.id);
      expect(e.target.element).toBe(nodeShipping.id);
    });
  });

  describe('04-FU2 — mixed Subsystem↔Component dependency', () => {
    const m = makeBaseModel();
    Object.assign(m.elements as Record<string, unknown>, {
      s1: el('s1', 'Subsystem', 'A', null),
      s2: el('s2', 'Subsystem', 'B', null),
      c1: el('c1', 'Component', 'Ca', 's1'),
      c2: el('c2', 'Component', 'Cb', 's2'),
    });
    // Dep from a Subsystem to a Component in a *different* Subsystem.
    Object.assign(m.relationships as Record<string, unknown>, {
      r1: dep('r1', 's1', 'c2'),
    });
    const r = componentModelToDeploymentModel(m);

    it('emits 1 STRUCTURAL DeploymentAssociation A → B', () => {
      if (!r.ok) throw new Error('expected ok');
      const structural = Object.values(r.model.relationships).filter((rel) => rel.type === 'DeploymentAssociation');
      expect(structural).toHaveLength(1);
    });
  });

  describe('06-v2 — element-mapping output', () => {
    it('maps DeploymentNode → source Subsystem, DeploymentComponent + Artifact → source Component, DeploymentAssociation → source ComponentDependency', () => {
      const m = makeBaseModel();
      Object.assign(m.elements as Record<string, unknown>, {
        s1: el('s1', 'Subsystem', 'Order', null),
        s2: el('s2', 'Subsystem', 'Shipping', null),
        c1: el('c1', 'Component', 'OrderAgent', 's1'),
        c2: el('c2', 'Component', 'ShippingAgent', 's2'),
      });
      Object.assign(m.relationships as Record<string, unknown>, {
        r1: dep('r1', 'c1', 'c2'),
      });
      const r = componentModelToDeploymentModel(m);
      if (!r.ok) throw new Error('expected ok');

      // Each DeploymentNode maps back to its source Subsystem.
      const nodes = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentNode');
      for (const node of nodes) {
        const sourceId = r.elementMapping[node.id];
        expect(sourceId).toBe(node.name === 'Order' ? 's1' : 's2');
      }

      // Each DeploymentComponent + its paired DeploymentArtifact both
      // map to the same source Component id.
      const dcs = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentComponent');
      const artifacts = Object.values(r.model.elements).filter((e) => e.type === 'DeploymentArtifact');
      for (const dc of dcs) {
        const expected = dc.name === 'OrderAgent' ? 'c1' : 'c2';
        expect(r.elementMapping[dc.id]).toBe(expected);
        const matchingArtifact = artifacts.find((a) => a.name === dc.name);
        expect(matchingArtifact).toBeDefined();
        expect(r.elementMapping[matchingArtifact!.id]).toBe(expected);
      }

      // The structural DeploymentAssociation maps to the source dep.
      const structural = Object.values(r.model.relationships).filter((rel) => rel.type === 'DeploymentAssociation');
      expect(structural).toHaveLength(1);
      expect(r.elementMapping[structural[0].id]).toBe('r1');
    });

    it('synthetic emissions (Default Host, manifest DeploymentDependency) are absent from elementMapping', () => {
      const m = makeBaseModel();
      Object.assign(m.elements as Record<string, unknown>, {
        c1: el('c1', 'Component', 'Orphan1', null),
        c2: el('c2', 'Component', 'Orphan2', null),
      });
      const r = componentModelToDeploymentModel(m);
      if (!r.ok) throw new Error('expected ok');

      // Default Host has no entry.
      const host = Object.values(r.model.elements).find(
        (e) => e.type === 'DeploymentNode' && e.name === 'Default Host',
      );
      expect(host).toBeDefined();
      expect(r.elementMapping[host!.id]).toBeUndefined();

      // Manifest DeploymentDependencies have no entry either.
      const manifests = Object.values(r.model.relationships).filter((rel) => rel.type === 'DeploymentDependency');
      expect(manifests.length).toBeGreaterThan(0);
      for (const m2 of manifests) {
        expect(r.elementMapping[m2.id]).toBeUndefined();
      }
    });
  });
});
