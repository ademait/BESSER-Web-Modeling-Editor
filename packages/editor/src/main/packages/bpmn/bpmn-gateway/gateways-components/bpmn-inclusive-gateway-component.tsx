import React, { FunctionComponent } from 'react';
import { ThemedCircle, ThemedPolyline } from '../../../../components/theme/themedComponents';
import { Multiline } from '../../../../utils/svg/multiline';
import { BPMNBotIcon } from '../../common/icons/bpmn-bot-icon';
import { BPMNMergeMarkerIcon } from '../../common/icons/bpmn-merge-marker-icon';
import { BPMNCollaborationMarkerIcon } from '../../common/icons/bpmn-collaboration-marker-icon';
import { COLLAB_LETTER, MERGING_TWO_LETTER, Props } from '../bpmn-gateway-component';

export const BPMNInclusiveGatewayComponent: FunctionComponent<Props> = ({ element, fillColor }) => (
  <g>
    <ThemedPolyline
      points={`${element.bounds.width / 2} 0, ${element.bounds.width} ${element.bounds.height / 2}, ${
        element.bounds.width / 2
      } ${element.bounds.height}, 0 ${element.bounds.height / 2}, ${element.bounds.width / 2} 0`}
      strokeColor={element.strokeColor}
      fillColor={fillColor || element.fillColor}
    />
    <ThemedCircle
      cx={element.bounds.width / 2}
      cy={element.bounds.height / 2}
      r={Math.min(element.bounds.width, element.bounds.height) / 2 - 12}
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
        <BPMNBotIcon x={-4} y={-4} color={element.strokeColor} />
        {element.gatewayRole === 'diverging' ? (
          <BPMNCollaborationMarkerIcon
            letter={COLLAB_LETTER[element.collaborationMode]}
            x={element.bounds.width - 12}
            y={element.bounds.height - 12}
            color={element.strokeColor}
          />
        ) : (
          <BPMNMergeMarkerIcon
            letter={MERGING_TWO_LETTER[element.mergingStrategy]}
            x={element.bounds.width - 12}
            y={element.bounds.height - 12}
            color={element.strokeColor}
          />
        )}
      </>
    )}
  </g>
);
