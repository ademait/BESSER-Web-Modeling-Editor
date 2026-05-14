import { DeepPartial } from 'redux';
import { BPMNSeaaElementType } from '..';
import { UMLElementType } from '../../uml-element-type';
import { BPMNSwimlane } from '../../bpmn/bpmn-swimlane/bpmn-swimlane';
import { UMLContainer } from '../../../services/uml-container/uml-container';
import * as Apollon from '../../../typings';
import { BPMNAgentRole, clampTrustScore } from '../common/types';

// Agentic BPMN — paper Fig. 3a: AgenticLane extends Lane with a Profile (role)
// and an Uncertainty (trust score, 0–100). Both helper classes are flattened to
// direct attributes per the attribute-based mapping (04D D-D3).
export class BPMNAgenticLane extends BPMNSwimlane {
  static defaultRole: BPMNAgentRole = 'worker';
  static defaultTrustScore = 0;

  type: UMLElementType = BPMNSeaaElementType.BPMNAgenticLane;
  role: BPMNAgentRole = BPMNAgenticLane.defaultRole;
  trustScore: number = BPMNAgenticLane.defaultTrustScore;

  constructor(values?: DeepPartial<BPMNAgenticLane>) {
    super(values as DeepPartial<BPMNSwimlane>);
    this.role = values?.role ?? BPMNAgenticLane.defaultRole;
    this.trustScore = clampTrustScore(values?.trustScore ?? BPMNAgenticLane.defaultTrustScore);
  }

  serialize(children?: UMLContainer[]): Apollon.BPMNAgenticLane {
    return {
      ...super.serialize(children),
      type: this.type as keyof typeof BPMNSeaaElementType,
      role: this.role,
      trustScore: this.trustScore,
    };
  }

  deserialize<T extends Apollon.UMLModelElement>(
    values: T & { role?: BPMNAgentRole; trustScore?: number },
    children?: Apollon.UMLModelElement[],
  ): void {
    super.deserialize(values, children);
    this.role = values.role ?? BPMNAgenticLane.defaultRole;
    this.trustScore = clampTrustScore(values.trustScore ?? BPMNAgenticLane.defaultTrustScore);
  }
}
