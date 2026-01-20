import React, { FunctionComponent } from 'react';
import { Text } from '../../../components/controls/text/text';
import { ThemedRect } from '../../../components/theme/themedComponents';
import { AgentGroup } from './agent-group';

interface Props {
  element: AgentGroup;
  fillColor?: string;
}

export const AgentGroupComponent: FunctionComponent<Props> = ({ element, fillColor }) => {
  return (
    <g>
      <ThemedRect
        width="100%"
        height="100%"
        fillColor={fillColor || element.fillColor}
        strokeColor={element.strokeColor}
        rx={5}
      />
      <svg height={30}>
        <Text fill={element.textColor} fontWeight="bold">
          {element.name}
        </Text>
      </svg>
      <svg y={35} height={20}>
        <Text fill={element.textColor} fontSize="smaller">
          {`Agents: ${element.numAgents}`}
        </Text>
      </svg>
    </g>
  );
};