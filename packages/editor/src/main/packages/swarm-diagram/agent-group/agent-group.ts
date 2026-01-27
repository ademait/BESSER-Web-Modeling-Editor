import { DeepPartial } from 'redux';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElementType } from '../../uml-element-type';
import { SwarmElementType } from '..';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { ILayer } from '../../../services/layouter/layer';
import * as Apollon from '../../../typings';

export interface IAgentGroup extends IUMLElement {
  numAgents: number;
  framework: string;
  persona: string;
  role: string;
}

/**
 * AgentGroup - Abstract base class for all agent types in a Swarm diagram.
 * 
 * This class should NOT be instantiated directly. Use one of the concrete subclasses:
 * - Evaluator
 * - Solver
 * - Supervisor
 * - Dispatcher
 * 
 * AgentGroup provides common properties and behavior for all agent types.
 */
export class AgentGroup extends UMLElement implements IAgentGroup {
  static features: UMLElementFeatures = {
    ...UMLElement.features,
    resizable: true,
  };
  static supportedContainers = [SwarmElementType.Swarm];
  static MIN_WIDTH = 40;
  static MIN_HEIGHT = 60;

  type: UMLElementType = SwarmElementType.AgentGroup;
  numAgents: number = 1;
  framework: string = 'BESSER-BAF';
  persona: string = '';
  role: string = '';
  

  constructor(values?: DeepPartial<IAgentGroup>) {
    super(values);
    this.name = values?.name ?? 'AgentGroup';
    this.numAgents = values?.numAgents ?? 1;
    this.framework = values?.framework ?? 'BESSER-BAF';
    this.persona = values?.persona ?? '';
    this.role = values?.role ?? '';
    // Update default bounds for robot head icon-style rendering
    this.bounds = {
      x: 0,
      y: 0,
      width: AgentGroup.MIN_WIDTH,
      height: AgentGroup.MIN_HEIGHT,
      ...values?.bounds,
    };
  }

  serialize(): Apollon.AgentGroup {
    return {
      ...super.serialize(),
      type: this.type as UMLElementType,
      numAgents: this.numAgents,
      framework: this.framework,
      persona: this.persona,
      role: this.role,
    };
  }

  render(canvas: ILayer): ILayoutable[] {
    // Enforce minimum dimensions
    if (this.bounds.width < AgentGroup.MIN_WIDTH) {
      this.bounds.width = AgentGroup.MIN_WIDTH;
    }
    if (this.bounds.height < AgentGroup.MIN_HEIGHT) {
      this.bounds.height = AgentGroup.MIN_HEIGHT;
    }
    return [this];
  }
}