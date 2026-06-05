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

  describe('16 — tools/skills as capability Components (opt-in)', () => {
    // A self-contained BPMN: one agentic worker lane with a task linking
    // an Agent diagram. The derivation matches `type: 'AgentTool'` by
    // string, so this exercises the full path without the editor element.
    const makeBpmn = (laneOverrides: Record<string, unknown> = {}, taskRef = 'ad1') =>
      ({
        version: '3.0.0',
        type: 'BPMNDiagram',
        size: { width: 800, height: 600 },
        elements: {
          P1: {
            id: 'P1',
            type: 'BPMNPool',
            name: 'Swarm',
            owner: null,
            bounds: { x: 0, y: 0, width: 400, height: 200 },
          },
          L1: {
            id: 'L1',
            type: 'BPMNSwimlane',
            name: 'Researcher',
            owner: 'P1',
            isAgentic: true,
            role: 'worker',
            bounds: { x: 20, y: 0, width: 380, height: 200 },
            ...laneOverrides,
          },
          T1: {
            id: 'T1',
            type: 'BPMNTask',
            name: 'Search',
            owner: 'L1',
            agentDiagramRef: taskRef,
            bounds: { x: 40, y: 20, width: 100, height: 60 },
          },
        },
        relationships: {},
        interactive: { elements: {}, relationships: {} },
        assessments: {},
      }) as unknown as UMLModel;

    const agentModel = {
      version: '3.0.0',
      type: 'AgentDiagram',
      size: { width: 100, height: 100 },
      elements: {
        tlA: {
          id: 'tlA',
          type: 'AgentTool',
          name: 'WebSearch',
          owner: null,
          bounds: { x: 0, y: 0, width: 1, height: 1 },
        },
        tlB: {
          id: 'tlB',
          type: 'AgentTool',
          name: 'WebSearch',
          owner: null,
          bounds: { x: 0, y: 0, width: 1, height: 1 },
        }, // dup name
        skA: {
          id: 'skA',
          type: 'AgentSkill',
          name: 'Summarise',
          owner: null,
          bounds: { x: 0, y: 0, width: 1, height: 1 },
        },
      },
      relationships: {},
      interactive: { elements: {}, relationships: {} },
      assessments: {},
    } as unknown as UMLModel;
    const agentDiagramsById = new Map([['ad1', agentModel]]);

    const capStereos = (m: UMLModel) =>
      Object.values(m.elements)
        .map((e) => (e as unknown as { stereotype?: string }).stereotype)
        .filter((s) => s === 'tool' || s === 'skill');

    it('T-U1 — default (no opts): emits no tool/skill Components (clean swarm)', () => {
      const r = bpmnModelToComponentModel(makeBpmn());
      if (!r.ok) throw new Error('expected ok');
      expect(capStereos(r.model)).toHaveLength(0);
    });

    it('T-U2 — opt-in: one `tool` (deduped) + one `skill`, with `uses` and `has` edges', () => {
      const r = bpmnModelToComponentModel(makeBpmn(), { agentDiagramsById, includeCapabilities: true });
      if (!r.ok) throw new Error('expected ok');
      const tools = Object.values(r.model.elements).filter(
        (e) => (e as unknown as { stereotype?: string }).stereotype === 'tool',
      );
      const skills = Object.values(r.model.elements).filter(
        (e) => (e as unknown as { stereotype?: string }).stereotype === 'skill',
      );
      expect(tools).toHaveLength(1); // WebSearch deduped (DQ5)
      expect(tools[0].name).toBe('WebSearch');
      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('Summarise');
      const edgeStereos = Object.values(r.model.relationships)
        .map((rel) => (rel as unknown as { stereotype?: string }).stereotype)
        .filter((s) => s === 'uses' || s === 'has')
        .sort();
      expect(edgeStereos).toEqual(['has', 'uses']); // DQ3
    });

    it('T-U3 — dangling agentDiagramRef: no capabilities, no throw', () => {
      const r = bpmnModelToComponentModel(makeBpmn({}, 'gone'), { agentDiagramsById, includeCapabilities: true });
      if (!r.ok) throw new Error('expected ok');
      expect(capStereos(r.model)).toHaveLength(0);
    });

    it('T-U4 — lineage: a capability Component maps to the linking BPMNTask id', () => {
      const r = bpmnModelToComponentModel(makeBpmn(), { agentDiagramsById, includeCapabilities: true });
      if (!r.ok) throw new Error('expected ok');
      const tool = Object.values(r.model.elements).find(
        (e) => (e as unknown as { stereotype?: string }).stereotype === 'tool',
      );
      expect(tool).toBeDefined();
      expect(r.elementMapping[tool!.id]).toBe('T1');
    });

    it('T-U5 — non-agentic lane: no capabilities even with includeCapabilities', () => {
      const r = bpmnModelToComponentModel(makeBpmn({ isAgentic: false, role: undefined }), {
        agentDiagramsById,
        includeCapabilities: true,
      });
      if (!r.ok) throw new Error('expected ok');
      expect(capStereos(r.model)).toHaveLength(0);
    });
  });

  describe('16-FU2 — grouped capability mode (Skills / Tools zones)', () => {
    // Single agentic lane → ad1 (tools WebSearch ×2 dup, skill Summarise).
    const makeBpmn = () =>
      ({
        version: '3.0.0',
        type: 'BPMNDiagram',
        size: { width: 800, height: 600 },
        elements: {
          P1: {
            id: 'P1',
            type: 'BPMNPool',
            name: 'Swarm',
            owner: null,
            bounds: { x: 0, y: 0, width: 400, height: 200 },
          },
          L1: {
            id: 'L1',
            type: 'BPMNSwimlane',
            name: 'Researcher',
            owner: 'P1',
            isAgentic: true,
            role: 'worker',
            bounds: { x: 20, y: 0, width: 380, height: 200 },
          },
          T1: {
            id: 'T1',
            type: 'BPMNTask',
            name: 'Search',
            owner: 'L1',
            agentDiagramRef: 'ad1',
            bounds: { x: 40, y: 20, width: 100, height: 60 },
          },
        },
        relationships: {},
        interactive: { elements: {}, relationships: {} },
        assessments: {},
      }) as unknown as UMLModel;

    // Two agentic lanes → ad1 + ad2; both list a tool named "WebSearch".
    const makeTwoAgentBpmn = () =>
      ({
        version: '3.0.0',
        type: 'BPMNDiagram',
        size: { width: 800, height: 600 },
        elements: {
          P1: {
            id: 'P1',
            type: 'BPMNPool',
            name: 'Swarm',
            owner: null,
            bounds: { x: 0, y: 0, width: 400, height: 400 },
          },
          L1: {
            id: 'L1',
            type: 'BPMNSwimlane',
            name: 'Researcher',
            owner: 'P1',
            isAgentic: true,
            role: 'worker',
            bounds: { x: 20, y: 0, width: 380, height: 200 },
          },
          T1: {
            id: 'T1',
            type: 'BPMNTask',
            name: 'Search',
            owner: 'L1',
            agentDiagramRef: 'ad1',
            bounds: { x: 40, y: 20, width: 100, height: 60 },
          },
          L2: {
            id: 'L2',
            type: 'BPMNSwimlane',
            name: 'Analyst',
            owner: 'P1',
            isAgentic: true,
            role: 'worker',
            bounds: { x: 20, y: 200, width: 380, height: 200 },
          },
          T2: {
            id: 'T2',
            type: 'BPMNTask',
            name: 'Analyse',
            owner: 'L2',
            agentDiagramRef: 'ad2',
            bounds: { x: 40, y: 220, width: 100, height: 60 },
          },
        },
        relationships: {},
        interactive: { elements: {}, relationships: {} },
        assessments: {},
      }) as unknown as UMLModel;

    const cap = (type: string, name: string, id: string) => ({
      id,
      type,
      name,
      owner: null,
      bounds: { x: 0, y: 0, width: 1, height: 1 },
    });
    const agentModel = (...els: Array<ReturnType<typeof cap>>) =>
      ({
        version: '3.0.0',
        type: 'AgentDiagram',
        size: { width: 100, height: 100 },
        elements: Object.fromEntries(els.map((e) => [e.id, e])),
        relationships: {},
        interactive: { elements: {}, relationships: {} },
        assessments: {},
      }) as unknown as UMLModel;

    const ad1 = agentModel(
      cap('AgentTool', 'WebSearch', 't1a'),
      cap('AgentTool', 'WebSearch', 't1b'),
      cap('AgentSkill', 'Summarise', 's1'),
    );
    const ad2 = agentModel(cap('AgentTool', 'WebSearch', 't2a'), cap('AgentTool', 'Calculator', 't2b'));
    const byId1 = new Map([['ad1', ad1]]);
    const byId2 = new Map([
      ['ad1', ad1],
      ['ad2', ad2],
    ]);
    const grouped = { includeCapabilities: true } as const;

    const subsystemsNamed = (m: UMLModel) =>
      Object.values(m.elements)
        .filter((e) => e.type === 'Subsystem')
        .map((e) => e.name);
    const byStereo = (m: UMLModel, s: string) =>
      Object.values(m.elements).filter((e) => (e as unknown as { stereotype?: string }).stereotype === s);
    const edgesByStereo = (m: UMLModel, s: string) =>
      Object.values(m.relationships).filter((r) => (r as unknown as { stereotype?: string }).stereotype === s);

    it('T-G1 — emits named Skills + Tools Subsystems holding the capabilities', () => {
      const r = bpmnModelToComponentModel(makeBpmn(), { agentDiagramsById: byId1, ...grouped });
      if (!r.ok) throw new Error('expected ok');
      expect(subsystemsNamed(r.model).sort()).toEqual(['Skills', 'Swarm', 'Tools']);
      expect(byStereo(r.model, 'tool')).toHaveLength(1); // WebSearch (dup collapsed)
      expect(byStereo(r.model, 'skill')).toHaveLength(1); // Summarise
      // capability Components are owned by a zone Subsystem, not the swarm
      const tool = byStereo(r.model, 'tool')[0];
      const owner = r.model.elements[(tool as unknown as { owner: string }).owner];
      expect(owner.name).toBe('Tools');
      expect(edgesByStereo(r.model, 'uses')).toHaveLength(1);
      expect(edgesByStereo(r.model, 'has')).toHaveLength(1);
    });

    it('T-G2 — cross-agent global dedup: shared tool = 1 Component, N edges (D1)', () => {
      const r = bpmnModelToComponentModel(makeTwoAgentBpmn(), { agentDiagramsById: byId2, ...grouped });
      if (!r.ok) throw new Error('expected ok');
      const tools = byStereo(r.model, 'tool');
      expect(tools.map((t) => t.name).sort()).toEqual(['Calculator', 'WebSearch']); // 2 unique
      const webSearch = tools.filter((t) => t.name === 'WebSearch');
      expect(webSearch).toHaveLength(1); // shared name → ONE box
      // ad1→WebSearch, ad2→WebSearch, ad2→Calculator = 3 `uses`
      expect(edgesByStereo(r.model, 'uses')).toHaveLength(3);
      const intoWebSearch = Object.values(r.model.relationships).filter(
        (rel) => (rel as unknown as { target: { element: string } }).target.element === webSearch[0].id,
      );
      expect(intoWebSearch).toHaveLength(2); // two agents point at the one box
    });

    it('T-G3 — lineage: a grouped capability maps to a contributing BPMNTask', () => {
      const r = bpmnModelToComponentModel(makeBpmn(), { agentDiagramsById: byId1, ...grouped });
      if (!r.ok) throw new Error('expected ok');
      const tool = byStereo(r.model, 'tool')[0];
      expect(r.elementMapping[tool.id]).toBe('T1');
    });
  });

  describe('16-FU3 — capability-heavy-agent warning (P2)', () => {
    // One agentic worker lane → one task → an Agent diagram with `n` tools.
    const makeBpmn = () =>
      ({
        version: '3.0.0',
        type: 'BPMNDiagram',
        size: { width: 800, height: 600 },
        elements: {
          P1: {
            id: 'P1',
            type: 'BPMNPool',
            name: 'Swarm',
            owner: null,
            bounds: { x: 0, y: 0, width: 400, height: 200 },
          },
          L1: {
            id: 'L1',
            type: 'BPMNSwimlane',
            name: 'Researcher',
            owner: 'P1',
            isAgentic: true,
            role: 'worker',
            bounds: { x: 20, y: 0, width: 380, height: 200 },
          },
          T1: {
            id: 'T1',
            type: 'BPMNTask',
            name: 'Search',
            owner: 'L1',
            agentDiagramRef: 'ad1',
            bounds: { x: 40, y: 20, width: 100, height: 60 },
          },
        },
        relationships: {},
        interactive: { elements: {}, relationships: {} },
        assessments: {},
      }) as unknown as UMLModel;

    const cap = (type: string, name: string, id: string) => ({
      id,
      type,
      name,
      owner: null,
      bounds: { x: 0, y: 0, width: 1, height: 1 },
    });
    const agentModelWithTools = (n: number) =>
      ({
        version: '3.0.0',
        type: 'AgentDiagram',
        size: { width: 100, height: 100 },
        elements: Object.fromEntries(
          Array.from({ length: n }, (_, i) => {
            const e = cap('AgentTool', `Tool${i}`, `t${i}`);
            return [e.id, e];
          }),
        ),
        relationships: {},
        interactive: { elements: {}, relationships: {} },
        assessments: {},
      }) as unknown as UMLModel;

    const grouped = { includeCapabilities: true } as const;
    const heavyWarnings = (m: { warnings: Array<{ kind: string }> }) =>
      m.warnings.filter((w) => w.kind === 'capability-heavy-agent');

    it('T-H1 — > threshold (11 tools) trips one capability-heavy-agent warning', () => {
      const byId = new Map([['ad1', agentModelWithTools(11)]]);
      const r = bpmnModelToComponentModel(makeBpmn(), { agentDiagramsById: byId, ...grouped });
      if (!r.ok) throw new Error('expected ok');
      const heavy = heavyWarnings(r);
      expect(heavy).toHaveLength(1);
      expect(heavy[0]).toMatchObject({ kind: 'capability-heavy-agent', laneId: 'L1', count: 11 });
      // D1 — nothing truncated: all 11 tool Components still emitted.
      expect(
        Object.values(r.model.elements).filter((e) => (e as { stereotype?: string }).stereotype === 'tool'),
      ).toHaveLength(11);
    });

    it('T-H2 — == threshold (10 tools) does NOT warn (boundary is strict >)', () => {
      const byId = new Map([['ad1', agentModelWithTools(10)]]);
      const r = bpmnModelToComponentModel(makeBpmn(), { agentDiagramsById: byId, ...grouped });
      if (!r.ok) throw new Error('expected ok');
      expect(heavyWarnings(r)).toHaveLength(0);
    });

    it('T-H3 — plain mode (includeCapabilities off) never warns', () => {
      const byId = new Map([['ad1', agentModelWithTools(11)]]);
      const r = bpmnModelToComponentModel(makeBpmn(), { agentDiagramsById: byId });
      if (!r.ok) throw new Error('expected ok');
      expect(heavyWarnings(r)).toHaveLength(0);
    });

    const zoneWarnings = (m: { warnings: Array<{ kind: string }> }) =>
      m.warnings.filter((w) => w.kind === 'capability-heavy-zone');

    it('T-H4 — > zone threshold (13 unique tools across agents) trips capability-heavy-zone', () => {
      // 7 + 6 = 13 distinct tool names, split 7/6 across two lanes so NO
      // single agent exceeds the per-agent threshold of 10 (the MH2 case).
      const adA = agentModelWithTools(7); // Tool0..Tool6
      const adB = {
        version: '3.0.0',
        type: 'AgentDiagram',
        size: { width: 100, height: 100 },
        elements: Object.fromEntries(
          Array.from({ length: 6 }, (_, i) => {
            const e = cap('AgentTool', `Other${i}`, `o${i}`);
            return [e.id, e];
          }),
        ),
        relationships: {},
        interactive: { elements: {}, relationships: {} },
        assessments: {},
      } as unknown as UMLModel;
      const bpmn = {
        version: '3.0.0',
        type: 'BPMNDiagram',
        size: { width: 800, height: 600 },
        elements: {
          P1: {
            id: 'P1',
            type: 'BPMNPool',
            name: 'Swarm',
            owner: null,
            bounds: { x: 0, y: 0, width: 400, height: 400 },
          },
          L1: {
            id: 'L1',
            type: 'BPMNSwimlane',
            name: 'A',
            owner: 'P1',
            isAgentic: true,
            role: 'worker',
            bounds: { x: 20, y: 0, width: 380, height: 200 },
          },
          T1: {
            id: 'T1',
            type: 'BPMNTask',
            name: 'a',
            owner: 'L1',
            agentDiagramRef: 'adA',
            bounds: { x: 40, y: 20, width: 100, height: 60 },
          },
          L2: {
            id: 'L2',
            type: 'BPMNSwimlane',
            name: 'B',
            owner: 'P1',
            isAgentic: true,
            role: 'worker',
            bounds: { x: 20, y: 200, width: 380, height: 200 },
          },
          T2: {
            id: 'T2',
            type: 'BPMNTask',
            name: 'b',
            owner: 'L2',
            agentDiagramRef: 'adB',
            bounds: { x: 40, y: 220, width: 100, height: 60 },
          },
        },
        relationships: {},
        interactive: { elements: {}, relationships: {} },
        assessments: {},
      } as unknown as UMLModel;
      const byId = new Map([
        ['adA', adA],
        ['adB', adB],
      ]);
      const r = bpmnModelToComponentModel(bpmn, { agentDiagramsById: byId, ...grouped });
      if (!r.ok) throw new Error('expected ok');
      expect(heavyWarnings(r)).toHaveLength(0); // no single heavy agent (7, 6)
      const zone = zoneWarnings(r);
      expect(zone).toHaveLength(1);
      expect(zone[0]).toMatchObject({ kind: 'capability-heavy-zone', zone: 'Tools', count: 13 });
    });

    it('T-H5 — == zone threshold (12) does NOT warn (strict >)', () => {
      const byId = new Map([['ad1', agentModelWithTools(12)]]);
      const r = bpmnModelToComponentModel(makeBpmn(), { agentDiagramsById: byId, ...grouped });
      if (!r.ok) throw new Error('expected ok');
      expect(zoneWarnings(r)).toHaveLength(0);
      // a single 12-tool agent DOES trip the per-agent warning — that's > 10
      expect(heavyWarnings(r)).toHaveLength(1);
    });

    it('T-H6 — grouped output is re-centered on the origin (scroll fix)', () => {
      const byId = new Map([['ad1', agentModelWithTools(12)]]); // tall Tools zone
      const r = bpmnModelToComponentModel(makeBpmn(), { agentDiagramsById: byId, ...grouped });
      if (!r.ok) throw new Error('expected ok');
      const bs = Object.values(r.model.elements).map(
        (e) => (e as unknown as { bounds: { x: number; y: number; width: number; height: number } }).bounds,
      );
      const minX = Math.min(...bs.map((b) => b.x));
      const maxX = Math.max(...bs.map((b) => b.x + b.width));
      const minY = Math.min(...bs.map((b) => b.y));
      const maxY = Math.max(...bs.map((b) => b.y + b.height));
      expect(Math.abs((minX + maxX) / 2)).toBeLessThanOrEqual(0.5);
      expect(Math.abs((minY + maxY) / 2)).toBeLessThanOrEqual(0.5);
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
