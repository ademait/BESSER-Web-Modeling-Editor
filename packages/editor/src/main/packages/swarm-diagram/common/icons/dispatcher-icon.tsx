import React, { FunctionComponent } from 'react';

interface Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
}

// Dispatcher icon - routing/branching arrows (fork pattern)
export const DispatcherIcon: FunctionComponent<Props> = ({ color = 'currentColor', ...props }) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Input arrow */}
    <path d="M4 12 L10 12" />
    {/* Fork point */}
    <circle cx="12" cy="12" r="2" fill={color} />
    {/* Output arrows - three branches */}
    <path d="M14 12 L20 6" />
    <path d="M14 12 L20 12" />
    <path d="M14 12 L20 18" />
    {/* Arrow heads */}
    <path d="M18 4 L20 6 L18 8" />
    <path d="M18 10 L20 12 L18 14" />
    <path d="M18 16 L20 18 L18 20" />
  </svg>
);