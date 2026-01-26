import { DeepPartial } from 'redux';
import { AgentGroup, IAgentGroup } from '../agent-group/agent-group';
import { UMLElementType } from '../../uml-element-type';
import { SwarmElementType } from '..';

export interface ISolver extends IAgentGroup {}

export class Solver extends AgentGroup implements ISolver {
  type: UMLElementType = SwarmElementType.Solver;

  constructor(values?: DeepPartial<ISolver>) {
    super(values);
    this.name = values?.name ?? 'Solver';
    this.role = values?.role ?? 'solver';
    this.fillColor = values?.fillColor ?? '#10b981';
  }
}