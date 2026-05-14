import React, { FunctionComponent } from 'react';
import { ThemedRect } from '../../../components/theme/themedComponents';
import { Multiline } from '../../../utils/svg/multiline';
import { BPMNAgenticLane } from './bpmn-agentic-lane';
import { BPMNBotIcon } from '../common/icons/bpmn-bot-icon';

// Paper Table 2: agent marker below the name; trust score between name and
// marker; role letter (w/m) below the marker. Exact placement is a
// tune-during-manual-test detail (Adem reviews the visuals).
export const BPMNAgenticLaneComponent: FunctionComponent<Props> = ({ element, fillColor, textColor, children }) => {
  const cx = 20;
  const cy = element.bounds.height / 2;
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
      <text x={cx} y={cy - 14} fontSize={10} textAnchor="middle" fill={fg} pointerEvents="none">
        {element.trustScore}
      </text>
      <BPMNBotIcon x={cx - 8} y={cy - 9} />
      <text x={cx} y={cy + 22} fontSize={10} textAnchor="middle" fill={fg} pointerEvents="none">
        {element.role === 'manager' ? 'm' : 'w'}
      </text>
      {children}
    </g>
  );
};

interface Props {
  element: BPMNAgenticLane;
  fillColor?: string;
  textColor?: string;
  children?: React.ReactNode;
}
