import React, { FunctionComponent } from 'react';

interface Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
}

// Supervisor icon - eye (oversight/monitoring)
export const SupervisorIcon: FunctionComponent<Props> = ({ color = 'currentColor', ...props }) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Eye outline */}
    <path d="M1 12 C1 12 5 4 12 4 C19 4 23 12 23 12 C23 12 19 20 12 20 C5 20 1 12 1 12 Z" />
    {/* Iris */}
    <circle cx="12" cy="12" r="4" />
    {/* Pupil */}
    <circle cx="12" cy="12" r="2" fill={color} />
  </svg>
);