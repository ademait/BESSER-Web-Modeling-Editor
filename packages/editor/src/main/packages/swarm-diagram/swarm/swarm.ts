import { DeepPartial } from 'redux';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElementType } from '../../uml-element-type';
import { SwarmElementType } from '..';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';

export interface ISwarm extends IUMLElement {
  // Add custom properties here later
}

export class Swarm extends UMLElement implements ISwarm {
  static features: UMLElementFeatures = {
    ...UMLElement.features,
    resizable: true,  // Can resize width and height
    droppable: false,
  };

  type: UMLElementType = SwarmElementType.Swarm;

  constructor(values?: DeepPartial<ISwarm>) {
    super(values);
    this.name = values?.name ?? 'Swarm';
    this.bounds = {
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      ...values?.bounds,
    };
  }
  
  render(canvas: ILayer): ILayoutable[] {
    return [this];
  }
}