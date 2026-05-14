import React, { FunctionComponent } from 'react';
import { ThemedRect } from '../../../components/theme/themedComponents';
import { BPMNSwimlane } from './bpmn-swimlane';
import { Multiline } from '../../../utils/svg/multiline';
import { BPMNBotIcon } from '../common/icons/bpmn-bot-icon';

export const BPMNSwimlaneComponent: FunctionComponent<Props> = ({ element, fillColor, textColor, children }) => {
  const fg = textColor || element.textColor;
  return (
    <g>
      <ThemedRect
        width={element.bounds.width}
        height={element.bounds.height}
        fillColor={fillColor || element.fillColor}
      />
      <Multiline
        y={20}
        x={-(element.bounds.height / 2)}
        transform="rotate(270)"
        textAnchor="middle"
        alignmentBaseline="middle"
        pointerEvents="none"
        fill={fg}
      >
        {element.name}
      </Multiline>
      {/* Agentic BPMN (04D): the agent marker + role letter sit to the right of
          the (vertical) lane name. Trust score is edited in the popup only. */}
      {element.isAgentic && (
        <>
          <BPMNBotIcon x={34} y={element.bounds.height / 2 - 8} color={fg} />
          <text x={56} y={element.bounds.height / 2 + 4} fontSize={11} fontWeight="bold" fill={fg} pointerEvents="none">
            {element.role === 'manager' ? 'm' : 'w'}
          </text>
        </>
      )}
      {children}
    </g>
  );
};

interface Props {
  element: BPMNSwimlane;
  fillColor?: string;
  textColor?: string;
  children?: React.ReactNode;
}
