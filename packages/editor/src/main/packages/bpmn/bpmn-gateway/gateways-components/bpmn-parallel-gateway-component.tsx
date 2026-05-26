import React, { FunctionComponent } from 'react';
import { ThemedPolyline } from '../../../../components/theme/themedComponents';
import { Multiline } from '../../../../utils/svg/multiline';
import { BPMNBotIcon } from '../../common/icons/bpmn-bot-icon';
import { BPMNReflectionIcon } from '../../common/icons/bpmn-reflection-icon';
import { COLLAB_LETTER, MERGING_TWO_LETTER, Props } from '../bpmn-gateway-component';

export const BPMNParallelGatewayComponent: FunctionComponent<Props> = ({ element, fillColor }) => (
  <g>
    <ThemedPolyline
      points={`${element.bounds.width / 2} 0, ${element.bounds.width} ${element.bounds.height / 2}, ${
        element.bounds.width / 2
      } ${element.bounds.height}, 0 ${element.bounds.height / 2}, ${element.bounds.width / 2} 0`}
      strokeColor={element.strokeColor}
      fillColor={fillColor || element.fillColor}
    />
    <ThemedPolyline
      points={`${element.bounds.width / 2} 10, ${element.bounds.width / 2} ${element.bounds.height - 10}`}
      strokeColor={element.strokeColor}
      fillColor="transparent"
    />
    <ThemedPolyline
      points={`10 ${element.bounds.height / 2}, ${element.bounds.width - 10} ${element.bounds.height / 2}`}
      strokeColor={element.strokeColor}
      fillColor="transparent"
    />
    <Multiline
      x={element.bounds.width / 2}
      y={element.bounds.height + 20}
      width={element.bounds.width * 2}
      height={element.bounds.height}
      fill={element.textColor}
      lineHeight={16}
      capHeight={11}
      verticalAnchor="start"
    >
      {element.name}
    </Multiline>
    {/* Agentic BPMN (04D1 — paper Table 2): bot icon top-left, collaboration /
        merging marker bottom-right. Coords are first-pass; D-D5 — revisit on
        manual review. */}
    {element.isAgentic && (
      <>
        <BPMNBotIcon x={-12} y={-12} color={element.strokeColor} />
        <BPMNReflectionIcon
          letter={
            element.gatewayRole === 'diverging'
              ? COLLAB_LETTER[element.collaborationMode]
              : MERGING_TWO_LETTER[element.mergingStrategy]
          }
          x={element.bounds.width - 4}
          y={element.bounds.height - 4}
          color={element.strokeColor}
        />
      </>
    )}
  </g>
);
