/**
 * BPMN Diagram Modifier
 * Handles incremental modify_model operations for base BPMN process diagrams.
 *
 * Base BPMN only (tasks, gateways, events, sequence flows) — no pools/lanes
 * or agentic fields.
 */

import { DiagramModifier, ModelModification, ModifierHelpers } from './base';
import { BESSERModel } from '../UMLModelingService';

const BPMN_NODE_TYPES = ['BPMNTask', 'BPMNStartEvent', 'BPMNEndEvent', 'BPMNIntermediateEvent', 'BPMNGateway'];
const TASK_TYPES = new Set(['default', 'user', 'service', 'send', 'receive', 'manual', 'business-rule', 'script']);
const GATEWAY_TYPES = new Set(['exclusive', 'parallel', 'inclusive', 'event-based', 'complex']);

export class BPMNDiagramModifier implements DiagramModifier {
  getDiagramType() {
    return 'BPMN' as const;
  }

  canHandle(action: string): boolean {
    return ['add_task', 'add_gateway', 'add_event', 'add_flow', 'modify_node', 'remove_flow', 'remove_element'].includes(action);
  }

  applyModification(model: BESSERModel, modification: ModelModification): BESSERModel {
    const updated = ModifierHelpers.cloneModel(model);
    if (!updated.relationships) updated.relationships = {};

    switch (modification.action) {
      case 'add_task': return this.addTask(updated, modification);
      case 'add_gateway': return this.addGateway(updated, modification);
      case 'add_event': return this.addEvent(updated, modification);
      case 'add_flow': return this.addFlow(updated, modification);
      case 'modify_node': return this.modifyNode(updated, modification);
      case 'remove_flow': return this.removeFlow(updated, modification);
      case 'remove_element': return this.removeElement(updated, modification);
      default: throw new Error(`Unsupported action for BPMN: ${modification.action}`);
    }
  }

  private nextPosition(model: BESSERModel): { x: number; y: number } {
    let maxRight = 0;
    let sumY = 0;
    let count = 0;
    for (const el of Object.values(model.elements)) {
      if (!BPMN_NODE_TYPES.includes((el as any).type)) continue;
      const b = (el as any).bounds || {};
      maxRight = Math.max(maxRight, (b.x || 0) + (b.width || 0));
      sumY += b.y || 0;
      count += 1;
    }
    return { x: count ? maxRight + 60 : 0, y: count ? Math.round(sumY / count) : 0 };
  }

  private findNode(model: BESSERModel, name?: string): string | null {
    if (!name) return null;
    for (const t of BPMN_NODE_TYPES) {
      const id = ModifierHelpers.findElementByName(model, name, t);
      if (id) return id;
    }
    return null;
  }

  private resolveNode(model: BESSERModel, ref?: string): string | null {
    if (!ref) return null;
    if (model.elements[ref] && BPMN_NODE_TYPES.includes((model.elements[ref] as any).type)) return ref;
    return this.findNode(model, ref);
  }

  private addTask(model: BESSERModel, m: ModelModification): BESSERModel {
    const { x, y } = this.nextPosition(model);
    const id = (m.target as any).nodeId || ModifierHelpers.generateUniqueId('bpmn');
    const taskType = TASK_TYPES.has(String((m.changes as any).taskType)) ? (m.changes as any).taskType : 'default';
    model.elements[id] = {
      id, type: 'BPMNTask',
      name: (m.target as any).nodeName || m.changes.name || 'Task',
      owner: null, bounds: { x, y, width: 140, height: 60 },
      taskType, marker: 'none',
    };
    return model;
  }

  private addGateway(model: BESSERModel, m: ModelModification): BESSERModel {
    const { x, y } = this.nextPosition(model);
    const id = (m.target as any).nodeId || ModifierHelpers.generateUniqueId('bpmn');
    const gatewayType = GATEWAY_TYPES.has(String((m.changes as any).gatewayType)) ? (m.changes as any).gatewayType : 'exclusive';
    model.elements[id] = {
      id, type: 'BPMNGateway',
      name: (m.target as any).nodeName || m.changes.name || '',
      owner: null, bounds: { x, y, width: 40, height: 40 }, gatewayType,
    };
    return model;
  }

  private addEvent(model: BESSERModel, m: ModelModification): BESSERModel {
    const { x, y } = this.nextPosition(model);
    const id = (m.target as any).nodeId || ModifierHelpers.generateUniqueId('bpmn');
    const kind = String((m.changes as any).eventKind || '').toLowerCase();
    const type =
      kind === 'start' ? 'BPMNStartEvent' : kind === 'intermediate' ? 'BPMNIntermediateEvent' : 'BPMNEndEvent';
    model.elements[id] = {
      id, type,
      name: (m.target as any).nodeName || m.changes.name || '',
      owner: null, bounds: { x, y, width: 40, height: 40 }, eventType: 'default',
    };
    return model;
  }

  private addFlow(model: BESSERModel, m: ModelModification): BESSERModel {
    const sourceId = this.resolveNode(model, m.changes.source);
    const targetId = this.resolveNode(model, m.changes.target);
    if (!sourceId || !targetId) throw new Error('Could not locate source or target node for the sequence flow.');
    const id = ModifierHelpers.generateUniqueId('flow');
    model.relationships[id] = {
      id, type: 'BPMNFlow',
      name: m.changes.label || m.changes.name || '',
      owner: null,
      bounds: { x: 0, y: 0, width: 100, height: 1 },
      path: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      source: { element: sourceId, direction: 'Right' },
      target: { element: targetId, direction: 'Left' },
      isManuallyLayouted: false, flowType: 'sequence', isDefault: false,
    };
    return model;
  }

  private modifyNode(model: BESSERModel, m: ModelModification): BESSERModel {
    const id = this.resolveNode(model, (m.target as any).nodeId) ?? this.resolveNode(model, (m.target as any).nodeName);
    if (id && model.elements[id]) {
      const el = model.elements[id] as any;
      if (m.changes.name) el.name = m.changes.name;
      if ((m.changes as any).taskType && el.type === 'BPMNTask' && TASK_TYPES.has((m.changes as any).taskType)) el.taskType = (m.changes as any).taskType;
      if ((m.changes as any).gatewayType && el.type === 'BPMNGateway' && GATEWAY_TYPES.has((m.changes as any).gatewayType)) el.gatewayType = (m.changes as any).gatewayType;
    }
    return model;
  }

  private removeFlow(model: BESSERModel, m: ModelModification): BESSERModel {
    const flowId = (m.target as any).flowId;
    if (flowId && model.relationships?.[flowId]) { delete model.relationships[flowId]; return model; }
    const src = this.resolveNode(model, m.changes.source);
    const tgt = this.resolveNode(model, m.changes.target);
    if (src && tgt && model.relationships) {
      for (const [rid, rel] of Object.entries(model.relationships)) {
        if ((rel as any).source?.element === src && (rel as any).target?.element === tgt) {
          delete model.relationships[rid];
          break;
        }
      }
    }
    return model;
  }

  private removeElement(model: BESSERModel, m: ModelModification): BESSERModel {
    const id = this.resolveNode(model, (m.target as any).nodeId) ?? this.resolveNode(model, (m.target as any).nodeName);
    if (!id) throw new Error(`Could not find a node matching "${(m.target as any).nodeName ?? (m.target as any).nodeId ?? ''}" to remove.`);
    return ModifierHelpers.removeElementWithChildren(model, id);
  }
}
