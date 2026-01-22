import { DeepPartial } from 'redux';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElementType } from '../../uml-element-type';
import { SwarmElementType } from '..';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import * as Apollon from '../../../typings';

export interface ISwarm extends IUMLElement {
  framework: string;
}

export class Swarm extends UMLElement implements ISwarm {
  static features: UMLElementFeatures = {
    ...UMLElement.features,
    resizable: true,  // Can resize width and height
    droppable: false,
  };

  type: UMLElementType = SwarmElementType.Swarm;
  framework: string = 'BESSER-BAF';

  constructor(values?: DeepPartial<ISwarm>) {
    super(values);
    this.name = values?.name ?? 'Swarm';
    this.framework = values?.framework ?? 'BESSER-BAF';
    this.bounds = {
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      ...values?.bounds,
    };
  }

  serialize(): Apollon.Swarm {
    return {
      ...super.serialize(),
      type: this.type as UMLElementType,
      framework: this.framework,
    };
  }
  
  render(canvas: ILayer): ILayoutable[] {
    return [this];
  }
}