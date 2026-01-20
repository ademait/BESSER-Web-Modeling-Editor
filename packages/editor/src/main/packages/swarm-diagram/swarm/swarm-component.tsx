import React, { FunctionComponent } from 'react';
import { Text } from '../../../components/controls/text/text';
import { ThemedRect } from '../../../components/theme/themedComponents';
import { Swarm } from './swarm';

interface Props {
  element: Swarm;
  fillColor?: string;
}

export const SwarmComponent: FunctionComponent<Props> = ({ element, fillColor }) => {
  return (
    <g>
      <ThemedRect
        width="100%"
        height="100%"
        fillColor={fillColor || element.fillColor}
        strokeColor={element.strokeColor}
        strokeWidth={2}
        rx={10}
      />
      <svg height={40}>
        <Text fill={element.textColor} fontWeight="bold">
          {element.name}
        </Text>
      </svg>
    </g>
  );
};