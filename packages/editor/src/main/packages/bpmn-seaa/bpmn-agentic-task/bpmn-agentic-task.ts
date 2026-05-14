import { DeepPartial } from 'redux';
import { BPMNSeaaElementType } from '..';
import { UMLElementType } from '../../uml-element-type';
import { BPMNTask } from '../../bpmn/bpmn-task/bpmn-task';
import { UMLContainer } from '../../../services/uml-container/uml-container';
import * as Apollon from '../../../typings';
import { BPMNReflectionMode, clampTrustScore } from '../common/types';

// Agentic BPMN — paper Fig. 3b: AgenticTask extends Task with a ReflectionMode
// and an Uncertainty (trust score, 0–100). collaborationMode is NOT modelled
// yet — see 04D1. taskType/marker are inherited from BPMNTask but kept at their
// defaults and not surfaced (an agentic task's identity is the agent marker).
export class BPMNAgenticTask extends BPMNTask {
  static defaultReflectionMode: BPMNReflectionMode = 'none';
  static defaultTrustScore = 0;

  type: UMLElementType = BPMNSeaaElementType.BPMNAgenticTask;
  reflectionMode: BPMNReflectionMode;
  trustScore: number;

  constructor(values?: DeepPartial<BPMNAgenticTask>) {
    super(values as DeepPartial<BPMNTask>);
    this.reflectionMode = values?.reflectionMode || BPMNAgenticTask.defaultReflectionMode;
    this.trustScore = clampTrustScore(values?.trustScore ?? BPMNAgenticTask.defaultTrustScore);
  }

  serialize(children?: UMLContainer[]): Apollon.BPMNAgenticTask {
    return {
      ...super.serialize(children),
      type: this.type as keyof typeof BPMNSeaaElementType,
      reflectionMode: this.reflectionMode,
      trustScore: this.trustScore,
    };
  }

  deserialize<T extends Apollon.UMLModelElement>(
    values: T & { reflectionMode?: BPMNReflectionMode; trustScore?: number },
    children?: Apollon.UMLModelElement[],
  ): void {
    super.deserialize(values, children);
    this.reflectionMode = values.reflectionMode || BPMNAgenticTask.defaultReflectionMode;
    this.trustScore = clampTrustScore(values.trustScore ?? BPMNAgenticTask.defaultTrustScore);
  }
}
