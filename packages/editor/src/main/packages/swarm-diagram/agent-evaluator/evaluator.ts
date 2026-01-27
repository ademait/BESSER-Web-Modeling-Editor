import { DeepPartial } from 'redux';
import { AgentGroup, IAgentGroup } from '../agent-group/agent-group';
import { UMLElementType } from '../../uml-element-type';
import { SwarmElementType } from '..';
import { SwarmRelationshipType } from '..';
import { UMLRelationshipType } from '../../uml-relationship-type';

export interface IEvaluator extends IAgentGroup {}

export class Evaluator extends AgentGroup implements IEvaluator {
  type: UMLElementType = SwarmElementType.Evaluator;
  static supportedRelationships =[
    SwarmRelationshipType.SwarmLink,
    SwarmRelationshipType.SupervisionLink,
  ];

  constructor(values?: DeepPartial<IEvaluator>) {
    super(values);
    this.name = values?.name ?? 'Evaluator';
    this.role = values?.role ?? 'evaluator';
    this.fillColor = values?.fillColor ?? '#f59e0b';
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