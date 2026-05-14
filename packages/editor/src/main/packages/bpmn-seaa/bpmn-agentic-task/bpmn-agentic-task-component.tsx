import React, { FunctionComponent } from 'react';
import { ThemedRect } from '../../../components/theme/themedComponents';
import { Multiline } from '../../../utils/svg/multiline';
import { BPMNAgenticTask } from './bpmn-agentic-task';
import { BPMNBotIcon } from '../common/icons/bpmn-bot-icon';
import { ReflectionIcon } from '../common/icons/reflection-icon';
import { BPMNReflectionMode } from '../common/types';

const REFLECTION_LETTER: Record<BPMNReflectionMode, string | null> = {
  none: null,
  self: 's',
  cross: 'c',
  human: 'h',
};

// Paper Table 2: agentic task = task shape + agent marker top-left + reflection
// marker at the bottom (letter s/c/h inside) + trust score top-right.
export const BPMNAgenticTaskComponent: FunctionComponent<Props> = ({ element, fillColor, strokeColor, textColor }) => {
  const letter = REFLECTION_LETTER[element.reflectionMode];
  const fg = textColor || element.textColor;
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
      <BPMNBotIcon x={6} y={6} />
      <text x={element.bounds.width - 6} y={15} fontSize={10} textAnchor="end" fill={fg} pointerEvents="none">
        {element.trustScore}
      </text>
      {letter && <ReflectionIcon letter={letter} x={element.bounds.width / 2 - 8} y={element.bounds.height - 18} />}
    </g>
  );
};

interface Props {
  element: BPMNAgenticTask;
  fillColor?: string;
  strokeColor?: string;
  textColor?: string;
}
