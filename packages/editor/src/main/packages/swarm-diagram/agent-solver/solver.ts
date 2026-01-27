import { DeepPartial } from 'redux';
import { AgentGroup, IAgentGroup } from '../agent-group/agent-group';
import { UMLElementType } from '../../uml-element-type';
import { SwarmElementType } from '..';
import { SwarmRelationshipType } from '..';
import { UMLRelationshipType } from '../../uml-relationship-type';

export interface ISolver extends IAgentGroup {}

export class Solver extends AgentGroup implements ISolver {
  type: UMLElementType = SwarmElementType.Solver;
  static supportedRelationships = [
    SwarmRelationshipType.SwarmLink,
    SwarmRelationshipType.DelegationLink,
    SwarmRelationshipType.SupervisionLink,
  ];

  constructor(values?: DeepPartial<ISolver>) {
    super(values);
    this.name = values?.name ?? 'Solver';
    this.role = values?.role ?? 'solver';
    this.fillColor = values?.fillColor ?? '#10b981';
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