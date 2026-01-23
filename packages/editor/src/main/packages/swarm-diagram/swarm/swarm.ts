import { Children } from 'react';
import { DeepPartial } from 'redux';
import { IUMLContainer, UMLContainer } from '../../../services/uml-container/uml-container';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElementType } from '../../uml-element-type';
import { assign } from '../../../utils/fx/assign';
import { SwarmElementType } from '..';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import * as Apollon from '../../../typings';

export interface ISwarm extends IUMLContainer {
  framework: string;
}

export class Swarm extends UMLContainer implements ISwarm {
  static features: UMLElementFeatures = {
    ...UMLContainer.features,
    resizable: true,  // Can resize width and height
    droppable: true,
  };

  type: UMLElementType = SwarmElementType.Swarm;
  framework: string = 'BESSER-BAF';

  static HEADER_HEIGHT = 50;
  static MIN_WIDTH = 200;
  static MIN_HEIGHT = 150;

  constructor(values?: DeepPartial<ISwarm>) {
    super(values);
    assign<ISwarm>(this, values);
    this.name = values?.name ?? 'Swarm';
    this.framework = values?.framework ?? 'BESSER-BAF';
    this.bounds = {
      x: 0,
      y: 0,
      width: Swarm.MIN_WIDTH,
      height: Swarm.MIN_HEIGHT,
      ...values?.bounds,
    };
  }

  serialize(children: UMLElement[] = []): Apollon.Swarm {
    return {
      ...super.serialize(children),
      type: this.type as UMLElementType,
      framework: this.framework,
    };
  }
  
  render(canvas: ILayer, children: ILayoutable[] = []): ILayoutable[] {
    // Ensure minimum dimensions
    if (this.bounds.width < Swarm.MIN_WIDTH) {
      this.bounds.width = Swarm.MIN_WIDTH;
    }
    if (this.bounds.height < Swarm.MIN_HEIGHT) {
      this.bounds.height = Swarm.MIN_HEIGHT;
    }

    // children to stay within Swarm bounds
    const padding = 10;
    const headerHeight = Swarm.HEADER_HEIGHT;
    
    for (const child of children) {
      child.bounds.x = Math.max(padding, 
        Math.min(child.bounds.x, this.bounds.width - child.bounds.width - padding));
      
      // Y (below header)
      child.bounds.y = Math.max(headerHeight + padding,
        Math.min(child.bounds.y, this.bounds.height - child.bounds.height - padding));
    }
    
    // Return self and all children
    return [this, ...children];
  }
}