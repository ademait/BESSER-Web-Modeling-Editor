import React, { FunctionComponent } from 'react';

interface Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
}

// Solver icon - gear/cog shape
export const SolverIcon: FunctionComponent<Props> = ({ color = 'currentColor', ...props }) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Gear teeth path */}
    <path d="M12 1 L12 3 M12 21 L12 23 M4.22 4.22 L5.64 5.64 M18.36 18.36 L19.78 19.78 M1 12 L3 12 M21 12 L23 12 M4.22 19.78 L5.64 18.36 M18.36 5.64 L19.78 4.22" />
    {/* Outer circle */}
    <circle cx="12" cy="12" r="7" />
    {/* Inner circle (hub) */}
    <circle cx="12" cy="12" r="3" />
  </svg>
);