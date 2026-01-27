import React, { FunctionComponent } from 'react';

interface Props extends React.SVGProps<SVGSVGElement> {
  color?: string;
}

// Evaluator icon - checkmark in circle (assessment/validation)
export const EvaluatorIcon: FunctionComponent<Props> = ({ color = 'currentColor', ...props }) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Circle */}
    <circle cx="12" cy="12" r="10" />
    {/* Checkmark */}
    <path d="M7 12 L10 15 L17 8" />
  </svg>
);