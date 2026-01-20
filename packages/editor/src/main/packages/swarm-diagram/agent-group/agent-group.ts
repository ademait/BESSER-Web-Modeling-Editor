import { DeepPartial } from 'redux';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElementType } from '../../uml-element-type';
import { SwarmElementType } from '..';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { ILayer } from '../../../services/layouter/layer';

export interface IAgentGroup extends IUMLElement {
  numAgents: number;
}

export class AgentGroup extends UMLElement implements IAgentGroup {
  static features: UMLElementFeatures = {
    ...UMLElement.features,
    resizable: true,
  };

  type: UMLElementType = SwarmElementType.AgentGroup;
  numAgents: number = 1;

  constructor(values?: DeepPartial<IAgentGroup>) {
    super(values);
    this.name = values?.name ?? 'AgentGroup';
    this.numAgents = values?.numAgents ?? 1;
    this.bounds = {
      x: 0,
      y: 0,
      width: 150,
      height: 80,
      ...values?.bounds,
    };
  }

  render(canvas: ILayer): ILayoutable[] {
    return [this];
  }
}