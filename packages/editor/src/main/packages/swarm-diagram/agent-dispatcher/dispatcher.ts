import { DeepPartial } from 'redux';
import { AgentGroup, IAgentGroup } from '../agent-group/agent-group';
import { UMLElementType } from '../../uml-element-type';
import { SwarmElementType } from '..';

export interface IDispatcher extends IAgentGroup {}

export class Dispatcher extends AgentGroup implements IDispatcher {
  type: UMLElementType = SwarmElementType.Dispatcher;

  constructor(values?: DeepPartial<IDispatcher>) {
    super(values);
    this.name = values?.name ?? 'Dispatcher';
    this.role = values?.role ?? 'dispatcher';
    this.fillColor = values?.fillColor ?? '#3b82f6';
    // Update default bounds for robot head icon-style rendering
    this.bounds = {
      x: 0,
      y: 0,
      width: 60,
      height: 80,
      ...values?.bounds,
    };
  }
}