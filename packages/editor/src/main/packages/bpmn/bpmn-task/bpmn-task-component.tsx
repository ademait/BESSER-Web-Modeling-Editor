import React, { FunctionComponent, ReactElement } from 'react';
import { BPMNTask, BPMNTaskType } from './bpmn-task';
import { ThemedRect } from '../../../components/theme/themedComponents';
import { Multiline } from '../../../utils/svg/multiline';
import { BPMNMessageIcon } from '../common/icons/bpmn-message-icon';
import { BPMNMessageFilledIcon } from '../common/icons/bpmn-message-filled-icon';
import { BPMNScriptIcon } from '../common/icons/bpmn-script-icon';
import { BPMNBusinessRuleIcon } from '../common/icons/bpmn-business-rule-icon';
import { BPMNManualIcon } from '../common/icons/bpmn-manual-icon';
import { BPMNUserIcon } from '../common/icons/bpmn-user-icon';
import { BPMNServiceIcon } from '../common/icons/bpmn-service-icon';
import { BPMNBotIcon } from '../common/icons/bpmn-bot-icon';
import { BPMNReflectionIcon } from '../common/icons/bpmn-reflection-icon';
import { BPMNSequentialMarkerIcon } from '../common/markers/bpmn-sequential-marker-icon';
import { BPMNMarkerType, BPMNReflectionMode } from '../common/types';
import { BpmnLoopMarkerIcon } from '../common/markers/bpmn-loop-marker-icon';
import { BPMNParallelMarkerIcon } from '../common/markers/bpmn-parallel-marker-icon';

// Agentic BPMN (04D): the reflection mode shows as a marker letter at the
// bottom of the task; 'none' renders nothing.
const REFLECTION_LETTER: Record<BPMNReflectionMode, string | null> = {
  none: null,
  self: 's',
  cross: 'c',
  human: 'h',
};

export const BPMNTaskComponent: FunctionComponent<Props> = ({ element, fillColor, strokeColor, textColor }) => {
  /**
   * Retrieve an icon based on a given task type
   * @param taskType The task type for which an icon should be rendered
   * @param props Additional props that are passed to the rendered icon
   */
  const renderIconForType = (
    taskType: BPMNTaskType,
    props: React.SVGProps<SVGSVGElement> = {},
  ): null | ReactElement => {
    switch (taskType) {
      case 'default':
        return null;
      case 'user':
        return <BPMNUserIcon {...props} />;
      case 'service':
        return <BPMNServiceIcon {...props} />;
      case 'send':
        return <BPMNMessageFilledIcon {...props} />;
      case 'receive':
        return <BPMNMessageIcon {...props} />;
      case 'manual':
        return <BPMNManualIcon {...props} />;
      case 'business-rule':
        return <BPMNBusinessRuleIcon {...props} />;
      case 'script':
        return <BPMNScriptIcon {...props} />;
      default:
        return null;
    }
  };

  const renderMarker = (taskType: BPMNMarkerType, props: React.SVGProps<SVGSVGElement> = {}): null | ReactElement => {
    switch (taskType) {
      case 'none':
        return null;
      case 'parallel multi instance':
        return <BPMNParallelMarkerIcon {...props} />;
      case 'sequential multi instance':
        return <BPMNSequentialMarkerIcon {...props} />;
      case 'loop':
        return <BpmnLoopMarkerIcon {...props} />;
      default:
        return null;
    }
  };

  const fg = textColor || element.textColor;
  const reflectionLetter = REFLECTION_LETTER[element.reflectionMode];

  return (
    <g>
      <ThemedRect
        rx={10}
        ry={10}
        width="100%"
        height="100%"
        fillColor={fillColor || element.fillColor}
        strokeColor={strokeColor || element.strokeColor}
      />
      <Multiline
        x={element.bounds.width / 2}
        y={element.bounds.height / 2}
        width={element.bounds.width}
        height={element.bounds.height}
        fontWeight="bold"
        fill={fg}
        lineHeight={16}
        capHeight={11}
      >
        {element.name}
      </Multiline>
      {/* Agentic BPMN (04D): the agent marker replaces the task-type icon and
          the reflection marker replaces the multi-instance marker. The trust
          score is edited in the popup only — not drawn on the canvas. */}
      {element.isAgentic ? (
        <BPMNBotIcon x={8} y={8} color={fg} />
      ) : (
        renderIconForType(element.taskType, { x: 10, y: 10 })
      )}
      {element.isAgentic
        ? reflectionLetter && (
            <BPMNReflectionIcon
              letter={reflectionLetter}
              x={element.bounds.width / 2 - 8}
              y={element.bounds.height - 20}
              color={fg}
            />
          )
        : renderMarker(element.marker, {
            x: element.bounds.width / 2 - 7,
            y: element.bounds.height - 16,
          })}
    </g>
  );
};

interface Props {
  element: BPMNTask;
  fillColor?: string;
  strokeColor?: string;
  textColor?: string;
}
