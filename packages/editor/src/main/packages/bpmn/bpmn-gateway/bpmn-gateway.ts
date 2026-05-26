import { BPMNElementType, BPMNRelationshipType } from '..';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { UMLElementType } from '../../uml-element-type';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { IBoundary } from '../../../utils/geometry/boundary';
import { DeepPartial } from 'redux';
import { assign } from '../../../utils/fx/assign';
import * as Apollon from '../../../typings';
import { UMLContainer } from '../../../services/uml-container/uml-container';
import { BPMNCollaborationMode, BPMNGatewayRole, BPMNMergingStrategy, clampTrustScore } from '../common/types';

export type BPMNGatewayType = 'complex' | 'event-based' | 'exclusive' | 'inclusive' | 'parallel';

// Agentic BPMN (04D1 — paper §4.3): collaboration constructs only attach to
// AgenticOR (inclusive) and AgenticAND (parallel) gateways. Exclusive is
// excluded by the paper; complex / event-based are not in the paper.
export const AGENTIC_ELIGIBLE_GATEWAY_TYPES: ReadonlySet<BPMNGatewayType> = new Set<BPMNGatewayType>([
  'parallel',
  'inclusive',
]);

export class BPMNGateway extends UMLContainer {
  static features: UMLElementFeatures = { ...UMLContainer.features, resizable: false };
  static defaultGatewayType: BPMNGatewayType = 'exclusive';
  static supportedRelationships = [BPMNRelationshipType.BPMNFlow];

  // Agentic BPMN defaults — only meaningful when isAgentic.
  static defaultGatewayRole: BPMNGatewayRole = 'diverging';
  static defaultCollaborationMode: BPMNCollaborationMode = 'voting';
  static defaultMergingStrategy: BPMNMergingStrategy = 'majority';
  static defaultTrustScore = 0;

  type: UMLElementType = BPMNElementType.BPMNGateway;
  bounds: IBoundary = { ...this.bounds, width: 40, height: 40 };
  gatewayType: BPMNGatewayType;
  isAgentic: boolean;
  gatewayRole: BPMNGatewayRole;
  collaborationMode: BPMNCollaborationMode;
  mergingStrategy: BPMNMergingStrategy;
  trustScore: number;

  constructor(values?: DeepPartial<BPMNGateway>) {
    super(values);
    assign<BPMNGateway>(this, values);
    this.gatewayType = values?.gatewayType || BPMNGateway.defaultGatewayType;
    this.isAgentic = values?.isAgentic ?? false;
    this.gatewayRole = values?.gatewayRole ?? BPMNGateway.defaultGatewayRole;
    this.collaborationMode = values?.collaborationMode ?? BPMNGateway.defaultCollaborationMode;
    this.mergingStrategy = values?.mergingStrategy ?? BPMNGateway.defaultMergingStrategy;
    this.trustScore = clampTrustScore(values?.trustScore ?? BPMNGateway.defaultTrustScore);
  }

  serialize(children?: UMLContainer[]): Apollon.BPMNGateway {
    return {
      ...super.serialize(),
      type: this.type as keyof typeof BPMNElementType,
      gatewayType: this.gatewayType,
      isAgentic: this.isAgentic,
      gatewayRole: this.gatewayRole,
      collaborationMode: this.collaborationMode,
      mergingStrategy: this.mergingStrategy,
      trustScore: this.trustScore,
    };
  }

  deserialize<T extends Apollon.UMLModelElement>(
    values: T & {
      gatewayType?: BPMNGatewayType;
      isAgentic?: boolean;
      gatewayRole?: BPMNGatewayRole;
      collaborationMode?: BPMNCollaborationMode;
      mergingStrategy?: BPMNMergingStrategy;
      trustScore?: number;
    },
    children?: Apollon.UMLModelElement[],
  ): void {
    super.deserialize(values, children);
    this.gatewayType = values.gatewayType || BPMNGateway.defaultGatewayType;
    this.isAgentic = values.isAgentic ?? false;
    this.gatewayRole = values.gatewayRole ?? BPMNGateway.defaultGatewayRole;
    this.collaborationMode = values.collaborationMode ?? BPMNGateway.defaultCollaborationMode;
    this.mergingStrategy = values.mergingStrategy ?? BPMNGateway.defaultMergingStrategy;
    this.trustScore = clampTrustScore(values.trustScore ?? BPMNGateway.defaultTrustScore);
  }

  render(canvas: ILayer): ILayoutable[] {
    return [this];
  }
}
