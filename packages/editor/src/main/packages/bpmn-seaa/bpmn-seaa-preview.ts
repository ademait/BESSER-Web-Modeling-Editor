import { ILayer } from '../../services/layouter/layer';
import { ComposePreview, PreviewElement } from '../compose-preview';
import { BPMNAgenticLane } from './bpmn-agentic-lane/bpmn-agentic-lane';
import { BPMNAgenticTask } from './bpmn-agentic-task/bpmn-agentic-task';

export const composeBpmnSeaaPreview: ComposePreview = (
  _layer: ILayer,
  translate: (id: string) => string,
): PreviewElement[] => {
  const elements: PreviewElement[] = [];

  elements.push(
    new BPMNAgenticLane({
      name: translate('packages.BPMN.BPMNAgenticLane'),
      bounds: { x: 0, y: 0, width: 160, height: 80 },
    }),
  );

  elements.push(
    new BPMNAgenticTask({
      name: translate('packages.BPMN.BPMNAgenticTask'),
      bounds: { x: 0, y: 0, width: 160, height: 60 },
    }),
  );

  return elements;
};
