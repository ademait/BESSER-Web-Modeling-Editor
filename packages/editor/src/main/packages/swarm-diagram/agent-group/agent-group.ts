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

export class AgentGroup extends UMLElement implements IAgentGroup {
  static features: UMLElementFeatures = {
    ...UMLElement.features,
    resizable: true,
  };

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
    this.bounds = {
      x: 0,
      y: 0,
      width: 150,
      height: 80,
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
    return [this];
  }
}