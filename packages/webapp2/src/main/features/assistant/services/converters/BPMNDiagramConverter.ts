/**
 * BPMN Diagram Converter
 * Converts a simplified base-BPMN process spec (nodes + sequence flows)
 * emitted by the modeling agent into the Apollon BPMNDiagram model.
 *
 * Base BPMN only — no agentic fields (isAgentic, role, gatewayRole,
 * trustScore, governanceDsl, …) and no pools / lanes (flat process).
 * Output shape matches the verified base-BPMN template shape:
 * model.type === "BPMNDiagram"; sequence-flow paths are left for the
 * editor's layouter to recompute on load (isManuallyLayouted: false).
 */

import { DiagramConverter, generateUniqueId } from './base';

interface SpecNode {
  id?: string;
  name?: string;
  type?: string;
  taskType?: string;
  gatewayType?: string;
  eventType?: string;
}

interface SpecFlow {
  source?: string;
  target?: string;
  name?: string;
}

const COL_GAP = 220;
const ROW_GAP = 120;
const EVENT_SIZE = 40;
const TASK_W = 140;
const TASK_H = 60;

const TASK_TYPES = new Set(['default', 'user', 'service', 'send', 'receive', 'manual', 'business-rule', 'script']);
const GATEWAY_TYPES = new Set(['exclusive', 'parallel', 'inclusive', 'event-based', 'complex']);

export class BPMNDiagramConverter implements DiagramConverter {
  getDiagramType() {
    return 'BPMN' as const;
  }

  convertSingleElement(spec: any) {
    return this.convertCompleteSystem({ nodes: [spec], flows: [] });
  }

  convertCompleteSystem(systemSpec: any) {
    const rawNodes: SpecNode[] = Array.isArray(systemSpec?.nodes) ? systemSpec.nodes : [];
    const flows: SpecFlow[] = Array.isArray(systemSpec?.flows) ? systemSpec.flows : [];

    const nodes = rawNodes.map((n, i) => ({
      ...n,
      id: typeof n.id === 'string' && n.id.trim() ? n.id.trim() : `n${i}`,
    }));

    const elements: Record<string, any> = {};
    const relationships: Record<string, any> = {};
    const idMap: Record<string, string> = {};

    const layerOf = this.computeLayers(nodes, flows);
    const byLayer: Record<number, string[]> = {};
    nodes.forEach((n) => {
      const L = layerOf[n.id] ?? 0;
      (byLayer[L] ||= []).push(n.id);
    });

    nodes.forEach((n) => {
      const apollonType = this.normalizeType(n.type);
      const isTask = apollonType === 'BPMNTask';
      const w = isTask ? TASK_W : EVENT_SIZE;
      const h = isTask ? TASK_H : EVENT_SIZE;
      const layer = layerOf[n.id] ?? 0;
      const row = byLayer[layer].indexOf(n.id);
      const x = layer * COL_GAP;
      const y = row * ROW_GAP;
      const apollonId = generateUniqueId('bpmn');
      idMap[n.id] = apollonId;

      const base = {
        id: apollonId,
        name: typeof n.name === 'string' ? n.name : '',
        type: apollonType,
        owner: null,
        bounds: { x, y, width: w, height: h },
      };

      if (apollonType === 'BPMNTask') {
        const taskType = TASK_TYPES.has(String(n.taskType)) ? n.taskType : 'default';
        elements[apollonId] = { ...base, taskType, marker: 'none' };
      } else if (apollonType === 'BPMNGateway') {
        const gatewayType = GATEWAY_TYPES.has(String(n.gatewayType)) ? n.gatewayType : 'exclusive';
        elements[apollonId] = { ...base, gatewayType };
      } else {
        const eventType = typeof n.eventType === 'string' && n.eventType ? n.eventType : 'default';
        elements[apollonId] = { ...base, eventType };
      }
    });

    flows.forEach((f) => {
      const sourceId = idMap[String(f.source)];
      const targetId = idMap[String(f.target)];
      if (!sourceId || !targetId) return;

      const relId = generateUniqueId('flow');
      const { sourceDir, targetDir } = this.edgeDirections(String(f.source), String(f.target), layerOf, byLayer);

      relationships[relId] = {
        id: relId,
        name: typeof f.name === 'string' ? f.name : '',
        type: 'BPMNFlow',
        owner: null,
        bounds: { x: 0, y: 0, width: 100, height: 1 },
        path: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        source: { direction: sourceDir, element: sourceId },
        target: { direction: targetDir, element: targetId },
        isManuallyLayouted: false,
        flowType: 'sequence',
        isDefault: false,
      };
    });

    // Centre content on origin (canvas draws model (0,0) at the visual centre)
    const placed = Object.values(elements);
    if (placed.length) {
      const minX = Math.min(...placed.map((e) => e.bounds.x));
      const minY = Math.min(...placed.map((e) => e.bounds.y));
      const maxX = Math.max(...placed.map((e) => e.bounds.x + e.bounds.width));
      const maxY = Math.max(...placed.map((e) => e.bounds.y + e.bounds.height));
      const offsetX = -(minX + maxX) / 2;
      const offsetY = -(minY + maxY) / 2;
      placed.forEach((e) => {
        e.bounds.x += offsetX;
        e.bounds.y += offsetY;
      });
    }

    const layerKeys = Object.keys(byLayer).map(Number);
    const maxLayer = layerKeys.length ? Math.max(...layerKeys) : 0;
    const maxRows = Object.values(byLayer).reduce((m, a) => Math.max(m, a.length), 1);

    return {
      version: '3.0.0',
      type: 'BPMNDiagram',
      size: {
        width: Math.max(600, (maxLayer + 1) * COL_GAP),
        height: Math.max(320, maxRows * ROW_GAP),
      },
      interactive: { elements: {}, relationships: {} },
      elements,
      relationships,
      assessments: {},
    };
  }

  private normalizeType(rawType?: string): string {
    const t = (rawType || '').toLowerCase().replace(/[\s_-]/g, '');
    if (t === 'startevent' || t === 'start' || t === 'startnode') return 'BPMNStartEvent';
    if (t === 'endevent' || t === 'end' || t === 'endnode') return 'BPMNEndEvent';
    if (t === 'intermediateevent' || t === 'intermediate') return 'BPMNIntermediateEvent';
    if (t === 'gateway' || t === 'gate') return 'BPMNGateway';
    return 'BPMNTask';
  }

  private computeLayers(nodes: { id: string }[], flows: SpecFlow[]): Record<string, number> {
    const ids = new Set(nodes.map((n) => n.id));
    const succ: Record<string, string[]> = {};
    const indeg: Record<string, number> = {};
    nodes.forEach((n) => { succ[n.id] = []; indeg[n.id] = 0; });
    flows.forEach((f) => {
      const s = String(f.source);
      const t = String(f.target);
      if (ids.has(s) && ids.has(t) && s !== t) { succ[s].push(t); indeg[t] += 1; }
    });

    const layer: Record<string, number> = {};
    const remaining = { ...indeg };
    const queue: string[] = [];
    nodes.forEach((n) => { if (indeg[n.id] === 0) { layer[n.id] = 0; queue.push(n.id); } });
    if (queue.length === 0 && nodes.length) { layer[nodes[0].id] = 0; queue.push(nodes[0].id); }

    const visited = new Set<string>();
    while (queue.length) {
      const u = queue.shift() as string;
      if (visited.has(u)) continue;
      visited.add(u);
      const lu = layer[u] ?? 0;
      succ[u].forEach((v) => {
        layer[v] = Math.max(layer[v] ?? 0, lu + 1);
        remaining[v] -= 1;
        if (remaining[v] <= 0 && !visited.has(v)) queue.push(v);
      });
    }
    nodes.forEach((n) => { if (!(n.id in layer)) layer[n.id] = 0; });
    return layer;
  }

  private edgeDirections(
    sourceId: string,
    targetId: string,
    layerOf: Record<string, number>,
    byLayer: Record<number, string[]>,
  ): { sourceDir: string; targetDir: string } {
    const sLayer = layerOf[sourceId] ?? 0;
    const tLayer = layerOf[targetId] ?? 0;
    const sRow = (byLayer[sLayer] || []).indexOf(sourceId);
    const tRow = (byLayer[tLayer] || []).indexOf(targetId);
    const dx = tLayer - sLayer;
    const dy = tRow - sRow;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0 ? { sourceDir: 'Right', targetDir: 'Left' } : { sourceDir: 'Left', targetDir: 'Right' };
    }
    return dy >= 0 ? { sourceDir: 'Down', targetDir: 'Up' } : { sourceDir: 'Up', targetDir: 'Down' };
  }
}
