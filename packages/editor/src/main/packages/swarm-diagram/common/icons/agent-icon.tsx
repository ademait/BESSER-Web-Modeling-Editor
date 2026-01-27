import React, { FunctionComponent } from 'react';

interface Props extends React.SVGProps<SVGSVGElement> {
  fillColor?: string;
  strokeColor?: string;
}

/**
 * MOSAICO-style agent icon - a robot head with antenna, eyes, and smile
 * The head is filled with the agent's color, stroke for outlines
 */
export const AgentIcon: FunctionComponent<Props> = ({ 
  fillColor = '#3b82f6', 
  strokeColor = '#1e3a5f',
  ...props  
}) => (
  <svg {...props} viewBox="0 0 60 60" fill="none">
    {/* Antenna stem */}
    <line 
      x1="30" 
      y1="2" 
      x2="30" 
      y2="12" 
      stroke={strokeColor} 
      strokeWidth="3"
      strokeLinecap="round"
    />
    
    {/* Antenna ball */}
    <circle 
      cx="30" 
      cy="5" 
      r="5" 
      fill={fillColor} 
      stroke={strokeColor} 
      strokeWidth="2"
    />
    
    {/* Left ear/side panel */}
    <rect 
      x="2" 
      y="24" 
      width="6" 
      height="18" 
      rx="3" 
      fill={fillColor} 
      stroke={strokeColor} 
      strokeWidth="2"
    />
    
    {/* Right ear/side panel */}
    <rect 
      x="52" 
      y="24" 
      width="6" 
      height="18" 
      rx="3" 
      fill={fillColor} 
      stroke={strokeColor} 
      strokeWidth="2"
    />
    
    {/* Main head - rounded rectangle */}
    <rect 
      x="8" 
      y="12" 
      width="44" 
      height="42" 
      rx="10" 
      fill={fillColor} 
      stroke={strokeColor} 
      strokeWidth="3"
    />
    
    {/* Left eye - outer circle */}
    <circle 
      cx="22" 
      cy="30" 
      r="7" 
      fill="white" 
      stroke={strokeColor} 
      strokeWidth="2"
    />
    
    {/* Left eye - pupil */}
    <circle 
      cx="22" 
      cy="30" 
      r="3" 
      fill={strokeColor}
    />
    
    {/* Right eye - outer circle */}
    <circle 
      cx="38" 
      cy="30" 
      r="7" 
      fill="white" 
      stroke={strokeColor} 
      strokeWidth="2"
    />
    
    {/* Right eye - pupil */}
    <circle 
      cx="38" 
      cy="30" 
      r="3" 
      fill={strokeColor}
    />
    
    {/* Smile */}
    <path 
      d="M 20 42 Q 30 50 40 42" 
      fill="none" 
      stroke={strokeColor} 
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);