import { BPMNRelationshipType } from '..';
import { UMLRelationship } from '../../../services/uml-relationship/uml-relationship';
import { DeepPartial } from 'redux';
import { UMLRelationshipCenteredDescription } from '../../../services/uml-relationship/uml-relationship-centered-description';
import { UMLElement } from '../../../services/uml-element/uml-element';
import * as Apollon from '../../../typings';
import { BPMNCollaborationMode, BPMNMergingStrategy, clampTrustScore } from '../common/types';

export type BPMNFlowType = 'sequence' | 'message' | 'association' | 'data association';

export class BPMNFlow extends UMLRelationshipCenteredDescription {
  static features = { ...UMLRelationship.features };
  static defaultFlowType: BPMNFlowType = 'sequence';

  // Agentic BPMN (04D1) defaults — only meaningful when isAgentic + message.
  // A single agentic message flow carries both collaborationMode (rendered at
  // the source end as the outgoing collab letter) and mergingStrategy
  // (rendered at the target end as the two-letter merging marker). Direction
  // is already encoded by the flow's source / target endpoints — no separate
  // flowDirection field (paper §4.4 splits these conceptually, but a single
  // flow naturally carries both ends).
  static defaultCollaborationMode: BPMNCollaborationMode = 'voting';
  static defaultMergingStrategy: BPMNMergingStrategy = 'majority';
  static defaultTrustScore = 0;

  type = BPMNRelationshipType.BPMNFlow;
  name = '';

  flowType: BPMNFlowType;
  isDefault: boolean;
  isAgentic: boolean;
  collaborationMode: BPMNCollaborationMode;
  mergingStrategy: BPMNMergingStrategy;
  trustScore: number;

  constructor(values?: DeepPartial<Apollon.BPMNFlow>) {
    super(values);
    this.name = values?.name || this.name;
    this.flowType = values?.flowType || BPMNFlow.defaultFlowType;
    this.isDefault = values?.isDefault ?? false;
    this.isAgentic = values?.isAgentic ?? false;
    this.collaborationMode = values?.collaborationMode ?? BPMNFlow.defaultCollaborationMode;
    this.mergingStrategy = values?.mergingStrategy ?? BPMNFlow.defaultMergingStrategy;
    this.trustScore = clampTrustScore(values?.trustScore ?? BPMNFlow.defaultTrustScore);
  }

  serialize(children?: UMLElement[]): Apollon.BPMNFlow {
    return {
      ...super.serialize(),
      type: this.type as keyof typeof BPMNRelationshipType,
      flowType: this.flowType,
      isDefault: this.isDefault,
      isAgentic: this.isAgentic,
      collaborationMode: this.collaborationMode,
      mergingStrategy: this.mergingStrategy,
      trustScore: this.trustScore,
    };
  }

  deserialize<T extends Apollon.UMLModelElement>(
    values: T & {
      flowType?: BPMNFlowType;
      isDefault?: boolean;
      isAgentic?: boolean;
      collaborationMode?: BPMNCollaborationMode;
      mergingStrategy?: BPMNMergingStrategy;
      trustScore?: number;
    },
    children?: Apollon.UMLModelElement[],
  ): void {
    super.deserialize(values, children);
    this.flowType = values.flowType || BPMNFlow.defaultFlowType;
    this.isDefault = values.isDefault ?? false;
    this.isAgentic = values.isAgentic ?? false;
    this.collaborationMode = values.collaborationMode ?? BPMNFlow.defaultCollaborationMode;
    this.mergingStrategy = values.mergingStrategy ?? BPMNFlow.defaultMergingStrategy;
    this.trustScore = clampTrustScore(values.trustScore ?? BPMNFlow.defaultTrustScore);
  }
}
