import { DeepPartial } from 'redux';
import { BPMNElementType } from '..';
import { UMLElementType } from '../../uml-element-type';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { UMLContainer } from '../../../services/uml-container/uml-container';
import { assign } from '../../../utils/fx/assign';
import * as Apollon from '../../../typings';
import { BPMNAgentRole, clampTrustScore } from '../common/types';

export class BPMNSwimlane extends UMLContainer {
  static DEFAULT_HEIGHT = 80;
  static MIN_WIDTH = 80;
  static MIN_HEIGHT = 80;

  // Agentic BPMN (04D): a lane is marked agentic via `isAgentic` rather than a
  // separate element type. `role` / `trustScore` are only meaningful when set.
  static defaultRole: BPMNAgentRole = 'worker';
  static defaultTrustScore = 0;

  static features: UMLElementFeatures = {
    ...UMLElement.features,
    droppable: true,
    movable: false,
    connectable: false,
    // updatable so a double-click opens the lane popup (name + agentic toggle).
    updatable: true,
    resizable: 'HEIGHT',
  };

  type: UMLElementType = BPMNElementType.BPMNSwimlane;
  isAgentic: boolean;
  role: BPMNAgentRole;
  trustScore: number;

  constructor(values?: DeepPartial<BPMNSwimlane>) {
    super(values);
    assign<BPMNSwimlane>(this, values);
    this.isAgentic = values?.isAgentic ?? false;
    this.role = values?.role ?? BPMNSwimlane.defaultRole;
    this.trustScore = clampTrustScore(values?.trustScore ?? BPMNSwimlane.defaultTrustScore);
  }

  serialize(children?: UMLContainer[]): Apollon.BPMNSwimlane {
    return {
      ...super.serialize(children),
      type: this.type as keyof typeof BPMNElementType,
      isAgentic: this.isAgentic,
      role: this.role,
      trustScore: this.trustScore,
    };
  }

  deserialize<T extends Apollon.UMLModelElement>(
    values: T & { isAgentic?: boolean; role?: BPMNAgentRole; trustScore?: number },
    children?: Apollon.UMLModelElement[],
  ): void {
    super.deserialize(values, children);
    this.isAgentic = values.isAgentic ?? false;
    this.role = values.role ?? BPMNSwimlane.defaultRole;
    this.trustScore = clampTrustScore(values.trustScore ?? BPMNSwimlane.defaultTrustScore);
  }

  render(layer: ILayer, children: ILayoutable[] = []): ILayoutable[] {
    if (this.bounds.width < BPMNSwimlane.MIN_WIDTH) {
      this.bounds.width = BPMNSwimlane.MIN_WIDTH;
    }

    if (this.bounds.height < BPMNSwimlane.MIN_HEIGHT) {
      this.bounds.height = BPMNSwimlane.MIN_HEIGHT;
    }

    return [this, ...children];
  }
}
