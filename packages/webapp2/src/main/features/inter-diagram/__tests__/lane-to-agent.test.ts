import { describe, it, expect } from 'vitest';
import type { UMLModel } from '@besser/wme';
import { laneToAgentModel } from '../lane-to-agent';

function bpmn(): UMLModel {
  return {
    version: '3.0.0',
    // UMLDiagramType.BPMN's wire value is 'BPMNDiagram' (04E divergence) — the
    // transform guards on the enum, so the fixture must use the wire value.
    type: 'BPMNDiagram',
    size: { width: 800, height: 600 },
    elements: {},
    interactive: { elements: {}, relationships: {} },
    relationships: {},
    assessments: {},
  } as unknown as UMLModel;
}
const lane = (id: string, agentic = true) => ({
  id,
  name: 'Coder',
  type: 'BPMNSwimlane',
  owner: null,
  isAgentic: agentic,
  bounds: { x: 0, y: 0, width: 400, height: 200 },
});
const task = (id: string, name: string, x: number) => ({
  id,
  name,
  type: 'BPMNTask',
  owner: 'L',
  bounds: { x, y: 0, width: 100, height: 60 },
});
const gw = (id: string, x: number) => ({
  id,
  name: '',
  type: 'BPMNGateway',
  owner: 'L',
  bounds: { x, y: 0, width: 40, height: 40 },
});
const seq = (id: string, s: string, t: string) => ({
  id,
  name: '',
  type: 'BPMNFlow',
  flowType: 'sequence',
  owner: null,
  path: [],
  source: { element: s, direction: 'Right' },
  target: { element: t, direction: 'Left' },
});

describe('29 — laneToAgentModel', () => {
  it('refuses a non-BPMN model', () => {
    const m = bpmn();
    (m as unknown as { type: string }).type = 'ComponentDiagram';
    const r = laneToAgentModel(m, 'L');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not-a-bpmn-diagram');
  });

  it('refuses a non-agentic lane', () => {
    const m = bpmn();
    Object.assign(m.elements, { L: lane('L', false), t1: task('t1', 'A', 10) });
    const r = laneToAgentModel(m, 'L');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('lane-not-agentic');
  });

  it('emits one AgentState per task, a chained transition, and one init', () => {
    const m = bpmn();
    Object.assign(m.elements, { L: lane('L'), t1: task('t1', 'Plan', 10), t2: task('t2', 'Code', 200) });
    Object.assign(m.relationships, { f1: seq('f1', 't1', 't2') });
    const r = laneToAgentModel(m, 'L');
    if (!r.ok) throw new Error('expected ok');
    const els = Object.values(r.model.elements);
    expect(
      els
        .filter((e) => e.type === 'AgentState')
        .map((e) => e.name)
        .sort(),
    ).toEqual(['Code', 'Plan']);
    expect(els.filter((e) => e.type === 'StateInitialNode')).toHaveLength(1); // t1 is the only entry
    const rels = Object.values(r.model.relationships);
    expect(rels.filter((e) => e.type === 'AgentStateTransition')).toHaveLength(1);
    expect(rels.filter((e) => e.type === 'AgentStateTransitionInit')).toHaveLength(1);
    // lineage maps state → task
    const planState = els.find((e) => e.name === 'Plan')!;
    expect(r.elementMapping[planState.id]).toBe('t1');
  });

  it('collapses an in-lane gateway between two tasks', () => {
    const m = bpmn();
    Object.assign(m.elements, { L: lane('L'), t1: task('t1', 'A', 10), g: gw('g', 120), t2: task('t2', 'B', 240) });
    Object.assign(m.relationships, { f1: seq('f1', 't1', 'g'), f2: seq('f2', 'g', 't2') });
    const r = laneToAgentModel(m, 'L');
    if (!r.ok) throw new Error('expected ok');
    const trans = Object.values(r.model.relationships).filter((e) => e.type === 'AgentStateTransition');
    expect(trans).toHaveLength(1); // A → B, gateway collapsed
    expect(Object.values(r.model.elements).filter((e) => e.type === 'StateInitialNode')).toHaveLength(1); // only A is entry
  });

  describe('30 — cross-lane I/O boundary states', () => {
    const laneB = (id: string, name: string) => ({
      id,
      name,
      type: 'BPMNSwimlane',
      owner: null,
      isAgentic: false,
      bounds: { x: 0, y: 300, width: 400, height: 200 },
    });
    const taskIn = (id: string, name: string, owner: string, x: number) => ({
      id,
      name,
      type: 'BPMNTask',
      owner,
      bounds: { x, y: 0, width: 100, height: 60 },
    });

    it('emits an «input» boundary for an incoming cross-lane sequence flow', () => {
      const m = bpmn();
      Object.assign(m.elements, {
        L: lane('L'),
        R: laneB('R', 'Reviewer'),
        t1: taskIn('t1', 'Work', 'L', 10),
        r1: taskIn('r1', 'Review', 'R', 10),
      });
      Object.assign(m.relationships, { f1: seq('f1', 'r1', 't1') }); // Reviewer → worker
      const res = laneToAgentModel(m, 'L');
      if (!res.ok) throw new Error('expected ok');
      const inputs = Object.values(res.model.elements).filter(
        (e) => e.type === 'AgentState' && (e as { stereotype?: string }).stereotype === 'input',
      );
      expect(inputs).toHaveLength(1);
      expect(inputs[0].name).toBe('from_Reviewer');
      // wired into the receiving task-state
      const trans = Object.values(res.model.relationships).filter((e) => e.type === 'AgentStateTransition');
      expect(trans.some((tr) => tr.source.element === inputs[0].id)).toBe(true);
    });

    it('emits an «output» boundary for an outgoing flow + dedups per external lane', () => {
      const m = bpmn();
      Object.assign(m.elements, {
        L: lane('L'),
        R: laneB('R', 'Reviewer'),
        t1: taskIn('t1', 'A', 'L', 10),
        t2: taskIn('t2', 'B', 'L', 200),
        r1: taskIn('r1', 'X', 'R', 10),
      });
      // two outgoing flows from L to the SAME external lane R
      Object.assign(m.relationships, { f1: seq('f1', 't1', 'r1'), f2: seq('f2', 't2', 'r1') });
      const res = laneToAgentModel(m, 'L');
      if (!res.ok) throw new Error('expected ok');
      const outputs = Object.values(res.model.elements).filter(
        (e) => e.type === 'AgentState' && (e as { stereotype?: string }).stereotype === 'output',
      );
      expect(outputs).toHaveLength(1); // deduped
      expect(outputs[0].name).toBe('to_Reviewer');
      const toBoundary = Object.values(res.model.relationships).filter(
        (e) => e.type === 'AgentStateTransition' && e.target.element === outputs[0].id,
      );
      expect(toBoundary).toHaveLength(2); // one per source task
    });

    it('does not emit boundaries for a self-contained lane', () => {
      const m = bpmn();
      Object.assign(m.elements, { L: lane('L'), t1: task('t1', 'A', 10), t2: task('t2', 'B', 200) });
      Object.assign(m.relationships, { f1: seq('f1', 't1', 't2') });
      const res = laneToAgentModel(m, 'L');
      if (!res.ok) throw new Error('expected ok');
      const boundaries = Object.values(res.model.elements).filter(
        (e) => e.type === 'AgentState' && ['input', 'output'].includes((e as { stereotype?: string }).stereotype ?? ''),
      );
      expect(boundaries).toHaveLength(0);
    });

    // 30-FU1 (IO-4): an input-fed task must not also get a StateInitialNode —
    // two start points is not a valid state machine.
    it('suppresses the start marker on input-fed tasks (no double start)', () => {
      const m = bpmn();
      Object.assign(m.elements, {
        L: lane('L'),
        R: laneB('R', 'Reviewer'),
        t1: taskIn('t1', 'A', 'L', 10),
        t2: taskIn('t2', 'B', 'L', 200),
        r1: taskIn('r1', 'X', 'R', 10),
      });
      Object.assign(m.relationships, { f1: seq('f1', 'r1', 't1'), f2: seq('f2', 'r1', 't2') });
      const res = laneToAgentModel(m, 'L');
      if (!res.ok) throw new Error('expected ok');
      const inputs = Object.values(res.model.elements).filter(
        (e) => e.type === 'AgentState' && (e as { stereotype?: string }).stereotype === 'input',
      );
      expect(inputs).toHaveLength(1); // deduped per external lane
      const inTrans = Object.values(res.model.relationships).filter(
        (e) => e.type === 'AgentStateTransition' && e.source.element === inputs[0].id,
      );
      expect(inTrans).toHaveLength(2); // one into each fed task
      // both tasks are input-fed → the loop skips both; item 17a guarantee-init adds one.
      expect(Object.values(res.model.elements).filter((e) => e.type === 'StateInitialNode')).toHaveLength(1);
    });

    // 30-FU1 (IO-6): a gateway-mediated input wires THROUGH to the downstream
    // task (not the entry), and that task's double start is suppressed while a
    // separate standalone task keeps its legitimate cold-start.
    it('wires a gateway-mediated input to the downstream task and suppresses its double start', () => {
      const m = bpmn();
      Object.assign(m.elements, {
        L: lane('L'),
        R: laneB('R', 'Reviewer'),
        impl: taskIn('impl', 'Implement', 'L', 10), // standalone cold-start entry
        tnew: taskIn('tnew', 'Downstream', 'L', 200), // fed via the gateway
        g: gw('g', 120), // gateway in L
        r1: taskIn('r1', 'X', 'R', 10), // external source
      });
      Object.assign(m.relationships, { f1: seq('f1', 'r1', 'g'), f2: seq('f2', 'g', 'tnew') });
      const res = laneToAgentModel(m, 'L');
      if (!res.ok) throw new Error('expected ok');
      const stateId = (name: string) =>
        Object.values(res.model.elements).find((e) => e.type === 'AgentState' && e.name === name)!.id;
      const inputs = Object.values(res.model.elements).filter(
        (e) => e.type === 'AgentState' && (e as { stereotype?: string }).stereotype === 'input',
      );
      expect(inputs).toHaveLength(1);
      expect(inputs[0].name).toBe('from_Reviewer');
      // input wires through the gateway to the downstream task, NOT the entry.
      const inTrans = Object.values(res.model.relationships).filter(
        (e) => e.type === 'AgentStateTransition' && e.source.element === inputs[0].id,
      );
      expect(inTrans).toHaveLength(1);
      expect(inTrans[0].target.element).toBe(stateId('Downstream'));
      // exactly one start point — on the standalone entry, not the input-fed task.
      const inits = Object.values(res.model.elements).filter((e) => e.type === 'StateInitialNode');
      expect(inits).toHaveLength(1);
      const initTrans = Object.values(res.model.relationships).filter((e) => e.type === 'AgentStateTransitionInit');
      expect(initTrans).toHaveLength(1);
      expect(initTrans[0].target.element).toBe(stateId('Implement'));
    });

    it('item 22 — a lane-owned start event does NOT produce a from_<self> boundary', () => {
      const startEvt = (id: string, owner: string) => ({
        id,
        name: '',
        type: 'BPMNStartEvent',
        owner,
        bounds: { x: -80, y: 0, width: 30, height: 30 },
      });
      const m = bpmn();
      Object.assign(m.elements, {
        L: lane('L'), // agentic BPMNSwimlane, name 'Coder'
        s1: startEvt('s1', 'L'), // start event OWNED by lane L
        t1: task('t1', 'coordinate_work', 10), // outer helper hardcodes owner 'L'
      });
      // intra-lane: start event (owned by L) → the lane's entry task
      Object.assign(m.relationships, { f1: seq('f1', 's1', 't1') });
      const res = laneToAgentModel(m, 'L');
      if (!res.ok) throw new Error('expected ok');
      const boundaries = Object.values(res.model.elements).filter(
        (e) => e.type === 'AgentState' && ['input', 'output'].includes((e as { stereotype?: string }).stereotype ?? ''),
      );
      expect(boundaries).toHaveLength(0); // no from_L / to_L
      // and exactly one cold-start marker on the entry task
      const inits = Object.values(res.model.elements).filter((e) => e.type === 'StateInitialNode');
      expect(inits).toHaveLength(1);
    });
  });

  describe('item 17 — BUML validity: state-name sanitization + guaranteed init', () => {
    it('Bug 1a: task name with spaces → underscored state name, no whitespace in output', () => {
      const m = bpmn();
      Object.assign(m.elements, { L: lane('L'), t1: task('t1', 'Plan Code', 10) });
      const r = laneToAgentModel(m, 'L');
      if (!r.ok) throw new Error('expected ok');
      const states = Object.values(r.model.elements).filter((e) => e.type === 'AgentState');
      expect(states.every((e) => !/\s/.test(e.name))).toBe(true);
      const taskState = states.find((e) => !(e as { stereotype?: string }).stereotype);
      expect(taskState?.name).toBe('Plan_Code');
    });

    it('Bug 1b: task name with hyphens/dots → underscored, no non-word chars', () => {
      const m = bpmn();
      Object.assign(m.elements, { L: lane('L'), t1: task('t1', 'Foo-Bar.Baz', 10) });
      const r = laneToAgentModel(m, 'L');
      if (!r.ok) throw new Error('expected ok');
      const taskStates = Object.values(r.model.elements).filter(
        (e) => e.type === 'AgentState' && !(e as { stereotype?: string }).stereotype,
      );
      expect(taskStates).toHaveLength(1);
      expect(taskStates[0].name).toBe('Foo_Bar_Baz');
      expect(/[^\w]/.test(taskStates[0].name)).toBe(false);
    });

    it('Bug 1c: external lane with a spaced name → «input» boundary state sanitized', () => {
      const m = bpmn();
      Object.assign(m.elements, {
        L: lane('L'),
        R: {
          id: 'R',
          name: 'Code Reviewer',
          type: 'BPMNSwimlane',
          owner: null,
          isAgentic: false,
          bounds: { x: 0, y: 300, width: 400, height: 200 },
        },
        t1: { id: 't1', name: 'Work', type: 'BPMNTask', owner: 'L', bounds: { x: 10, y: 0, width: 100, height: 60 } },
        r1: { id: 'r1', name: 'Review', type: 'BPMNTask', owner: 'R', bounds: { x: 10, y: 0, width: 100, height: 60 } },
      });
      Object.assign(m.relationships, { f1: seq('f1', 'r1', 't1') });
      const r = laneToAgentModel(m, 'L');
      if (!r.ok) throw new Error('expected ok');
      const inputs = Object.values(r.model.elements).filter(
        (e) => e.type === 'AgentState' && (e as { stereotype?: string }).stereotype === 'input',
      );
      expect(inputs).toHaveLength(1);
      expect(inputs[0].name).toBe('from_Code_Reviewer');
      expect(inputs[0].name).not.toMatch(/\s/);
    });

    it('Bug 2: single task entirely driven by an «input» flow → still one StateInitialNode', () => {
      const m = bpmn();
      Object.assign(m.elements, {
        L: lane('L'),
        R: {
          id: 'R',
          name: 'Caller',
          type: 'BPMNSwimlane',
          owner: null,
          isAgentic: false,
          bounds: { x: 0, y: 300, width: 400, height: 200 },
        },
        t1: { id: 't1', name: 'Handle', type: 'BPMNTask', owner: 'L', bounds: { x: 10, y: 0, width: 100, height: 60 } },
        r1: { id: 'r1', name: 'Trigger', type: 'BPMNTask', owner: 'R', bounds: { x: 10, y: 0, width: 100, height: 60 } },
      });
      Object.assign(m.relationships, { f1: seq('f1', 'r1', 't1') });
      const r = laneToAgentModel(m, 'L');
      if (!r.ok) throw new Error('expected ok');
      const inits = Object.values(r.model.elements).filter((e) => e.type === 'StateInitialNode');
      expect(inits).toHaveLength(1);
      const initTrans = Object.values(r.model.relationships).filter((e) => e.type === 'AgentStateTransitionInit');
      expect(initTrans).toHaveLength(1);
    });

    it('Bug 2: all state names are space-free even when guarantee-init fires on an input-fed task', () => {
      const m = bpmn();
      Object.assign(m.elements, {
        L: lane('L'),
        R: {
          id: 'R',
          name: 'External Agent',
          type: 'BPMNSwimlane',
          owner: null,
          isAgentic: false,
          bounds: { x: 0, y: 300, width: 400, height: 200 },
        },
        t1: {
          id: 't1',
          name: 'Process Request',
          type: 'BPMNTask',
          owner: 'L',
          bounds: { x: 10, y: 0, width: 100, height: 60 },
        },
        r1: { id: 'r1', name: 'X', type: 'BPMNTask', owner: 'R', bounds: { x: 10, y: 0, width: 100, height: 60 } },
      });
      Object.assign(m.relationships, { f1: seq('f1', 'r1', 't1') });
      const r = laneToAgentModel(m, 'L');
      if (!r.ok) throw new Error('expected ok');
      const allStateNames = Object.values(r.model.elements)
        .filter((e) => e.type === 'AgentState')
        .map((e) => e.name);
      expect(allStateNames.every((n) => !/\s/.test(n))).toBe(true);
    });
  });
});
