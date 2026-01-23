import React, { FunctionComponent } from 'react';
import { Text } from '../../../components/controls/text/text';
import { ThemedRect } from '../../../components/theme/themedComponents';
import { AgentGroup } from './agent-group';

interface Props {
  element: AgentGroup;
  fillColor?: string;
}

export const AgentGroupComponent: FunctionComponent<Props> = ({ element, fillColor }) => {
  // To show the orphan appearance, we do this check, but maybe we have to improve it later
  // Preview elements have no owner AND are at default position (0,0)
  // Real orphan elements have been placed on canvas (non-origin position)
  const isLikelyPreview = !element.owner && 
    element.bounds.x === 0 && 
    element.bounds.y === 0;
  
  // Only show orphan styling for real elements (not previews)
  const isOrphan = !element.owner && !isLikelyPreview;
  
  // Use red stroke for orphans to indicate invalid placement
  const strokeColor = isOrphan ? '#dc3545' : element.strokeColor;  // Bootstrap danger red
  const strokeWidth = isOrphan ? 3 : 1;

  return (
    <g>
      <ThemedRect
        width="100%"
        height="100%"
        fillColor={fillColor || element.fillColor}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={isOrphan ? '5,5' : undefined}  // Dashed border for orphans
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
      {/* Show warning text for orphans */}
      {isOrphan && (
        <svg y={element.bounds.height - 20} height={20}>
          <Text fill="#dc3545" fontSize="x-small">
            ⚠ Place inside Swarm
          </Text>
        </svg>
      )}
    </g>
  );
};