import { BPMNElementType, BPMNRelationshipType } from '..';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { UMLElementType } from '../../uml-element-type';
import { UMLContainer } from '../../../services/uml-container/uml-container';
import { DeepPartial } from 'redux';
import { assign } from '../../../utils/fx/assign';
import * as Apollon from '../../../typings';
import { BPMNMarkerType, BPMNReflectionMode, clampTrustScore } from '../common/types';

export type BPMNTaskType = 'default' | 'user' | 'service' | 'send' | 'receive' | 'manual' | 'business-rule' | 'script';

export class BPMNTask extends UMLContainer {
  static defaultTaskType: BPMNTaskType = 'default';
  static defaultMarker: BPMNMarkerType = 'none';
  // Agentic BPMN (04D): a task is marked agentic via `isAgentic` rather than a
  // separate element type. `reflectionMode` / `trustScore` are only meaningful
  // when set.
  static defaultReflectionMode: BPMNReflectionMode = 'none';
  static defaultTrustScore = 0;
  static supportedRelationships = [BPMNRelationshipType.BPMNFlow];

  type: UMLElementType = BPMNElementType.BPMNTask;
  taskType: BPMNTaskType;
  marker: BPMNMarkerType;
  isAgentic: boolean;
  reflectionMode: BPMNReflectionMode;
  trustScore: number;

  constructor(values?: DeepPartial<BPMNTask>) {
    super(values);
    assign<BPMNTask>(this, values);
    this.taskType = values?.taskType || BPMNTask.defaultTaskType;
    this.marker = values?.marker || BPMNTask.defaultMarker;
    this.isAgentic = values?.isAgentic ?? false;
    this.reflectionMode = values?.reflectionMode || BPMNTask.defaultReflectionMode;
    this.trustScore = clampTrustScore(values?.trustScore ?? BPMNTask.defaultTrustScore);
  }

  serialize(children?: UMLContainer[]): Apollon.BPMNTask {
    return {
      ...super.serialize(),
      type: this.type as keyof typeof BPMNElementType,
      taskType: this.taskType,
      marker: this.marker,
      isAgentic: this.isAgentic,
      reflectionMode: this.reflectionMode,
      trustScore: this.trustScore,
    };
  }

  deserialize<T extends Apollon.UMLModelElement>(
    values: T & {
      taskType?: BPMNTaskType;
      marker?: BPMNMarkerType;
      isAgentic?: boolean;
      reflectionMode?: BPMNReflectionMode;
      trustScore?: number;
    },
    children?: Apollon.UMLModelElement[],
  ): void {
    super.deserialize(values, children);
    this.taskType = values.taskType || BPMNTask.defaultTaskType;
    this.marker = values.marker || BPMNTask.defaultMarker;
    this.isAgentic = values.isAgentic ?? false;
    this.reflectionMode = values.reflectionMode || BPMNTask.defaultReflectionMode;
    this.trustScore = clampTrustScore(values.trustScore ?? BPMNTask.defaultTrustScore);
  }

  render(canvas: ILayer): ILayoutable[] {
    return [this];
  }
}
