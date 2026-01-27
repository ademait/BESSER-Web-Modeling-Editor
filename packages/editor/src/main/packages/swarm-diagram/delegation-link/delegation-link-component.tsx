import React, { FunctionComponent } from 'react';
import { Point } from '../../../utils/geometry/point';
import { ThemedPolyline } from '../../../components/theme/themedComponents';
import { DelegationLink } from './delegation-link';

interface Props {
  element: DelegationLink;
}

/**
 * Arrow marker for delegation (solid filled arrow)
 */
const DelegationArrowMarker = (id: string, color: string) => (
  <marker
    id={id}
    viewBox="0 0 10 10"
    refX="9"
    refY="5"
    markerWidth="8"
    markerHeight="8"
    orient="auto-start-reverse"
  >
    <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
  </marker>
);

/**
 * Compute position for relationship label (middle of path)
 */
const computeMiddlePosition = (path: Point[]): Point => {
  if (path.length < 2) return new Point();
  const midIndex = Math.floor(path.length / 2);
  
  if (path.length % 2 === 0) {
    // Even number of points: average the two middle points
    const p1 = path[midIndex - 1];
    const p2 = path[midIndex];
    return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
  }
  
  return new Point(path[midIndex].x, path[midIndex].y);
};

export const DelegationLinkComponent: FunctionComponent<Props> = ({ element }) => {
  const path = element.path.map((point) => new Point(point.x, point.y));
  const middle = computeMiddlePosition(path);
  const markerId = `delegation-marker-${element.id}`;
  
  const strokeColor = element.strokeColor || '#3b82f6';
  const textColor = element.textColor || strokeColor;

  return (
    <g>
      {/* Arrow marker definition */}
      {DelegationArrowMarker(markerId, strokeColor)}
      
      {/* Main line - solid */}
      <ThemedPolyline
        points={element.path.map((point) => `${point.x} ${point.y}`).join(',')}
        strokeColor={strokeColor}
        fillColor="none"
        strokeWidth={2}
        markerEnd={`url(#${markerId})`}
      />
      
      {/* Relationship label */}
      {element.name && (
        <text
          x={middle.x}
          y={middle.y}
          textAnchor="middle"
          dy="-8"
          pointerEvents="none"
          style={{
            fill: textColor,
            fontSize: '11px',
            fontWeight: 'bold',
            fontStyle: 'italic',
          }}
        >
          {element.name}
        </text>
      )}
    </g>
  );
};