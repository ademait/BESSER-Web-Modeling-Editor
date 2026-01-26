import { DeepPartial } from 'redux';
import { AgentGroup, IAgentGroup } from '../agent-group/agent-group';
import { UMLElementType } from '../../uml-element-type';
import { SwarmElementType } from '..';

export interface ISupervisor extends IAgentGroup {}

export class Supervisor extends AgentGroup implements ISupervisor {
  type: UMLElementType = SwarmElementType.Supervisor;

  constructor(values?: DeepPartial<ISupervisor>) {
    super(values);
    this.name = values?.name ?? 'Supervisor';
    this.role = values?.role ?? 'supervisor';
    this.fillColor = values?.fillColor ?? '#ef4444';
  }
}