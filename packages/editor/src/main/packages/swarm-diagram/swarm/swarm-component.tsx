import React, { FunctionComponent } from 'react';
import { Text } from '../../../components/controls/text/text';
import { ThemedRect, ThemedPath } from '../../../components/theme/themedComponents';
import { Swarm } from './swarm';

interface Props {
  element: Swarm;
  children?: React.ReactNode;
  fillColor?: string;
}

export const SwarmComponent: FunctionComponent<Props> = ({ element, children, fillColor }) => {
  const headerHeight = Swarm.HEADER_HEIGHT;

  return (
    <g>
      {/* Main container background */}
      <ThemedRect
        width="100%"
        height="100%"
        fillColor={fillColor || element.fillColor}
        strokeColor={element.strokeColor}
        strokeWidth={2}
        rx={10}
      />
      {/* Header area */}
      <ThemedRect
        width="100%"
        height={headerHeight}
        fillColor={fillColor || element.fillColor}
        strokeColor="none"
        rx={10}
      />
      {/* Header separator line */}
      <ThemedPath
        d={`M 0 ${headerHeight} H ${element.bounds.width}`}
        strokeColor={element.strokeColor}
      />
      {/* Swarm name */}
      <svg height={headerHeight}>
        <Text fill={element.textColor} fontWeight="bold">
          {element.name}
        </Text>
      </svg>
      {/* Children will be rendered here by the editor */}
      {children}
    </g>
  );
};