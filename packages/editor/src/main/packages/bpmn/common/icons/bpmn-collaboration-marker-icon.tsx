import React, { FunctionComponent } from 'react';

// Agentic BPMN collaboration marker for diverging gateways (SEAA'25 paper §4.4):
// the "collaboration / debate" three-node network glyph with the collaboration-
// mode letter (v / r / d / c) below. Clean-vector port of
// .claude/bpmn/examples/collaboration-debate.svg.
//
// Used on diverging agentic gateways only; merging gateways keep the
// BPMNReflectionIcon two-letter strategy badge (see guide 07 part 2 / 04D1).
export const BPMNCollaborationMarkerIcon: FunctionComponent<React.SVGProps<SVGSVGElement> & { letter: string }> = ({
  letter,
  ...props
}) => (
  <svg {...props} width={16} height={20} viewBox="0 0 22 27" fill="currentColor">
    {/* three interconnected nodes (collaboration glyph) */}
    <path d="m 18.857377,12.113 a 7.876,7.876 0 0 0 -3.956,-8.1 c 0,-0.021 0.006,-0.04 0.006,-0.061 a 3.952,3.952 0 0 0 -7.9039997,0 c 0,0.02 0.006,0.04 0.006,0.06 a 7.876,7.876 0 0 0 -3.956,8.101 3.946,3.946 0 1 0 4.242,5.93 7.855,7.855 0 0 0 7.3199997,0 3.945,3.945 0 1 0 4.242,-5.93 z m -7.902,-11.11 A 2.948,2.948 0 1 1 8.0073773,3.952 2.951,2.951 0 0 1 10.955377,1.004 Z M 3.9553773,18.901 a 2.948,2.948 0 1 1 2.948,-2.949 2.951,2.951 0 0 1 -2.948,2.948 z m 3.75,-1.76 a 3.896,3.896 0 0 0 0.202,-1.189 3.952,3.952 0 0 0 -3.868,-3.944 7.1,7.1 0 0 1 -0.088,-1.056 6.977,6.977 0 0 1 3.232,-5.885 3.926,3.926 0 0 0 7.5439997,0 6.977,6.977 0 0 1 3.232,5.885 7.1,7.1 0 0 1 -0.088,1.056 3.952,3.952 0 0 0 -3.868,3.944 3.896,3.896 0 0 0 0.202,1.188 7.13,7.13 0 0 1 -6.4999997,0 z M 17.955377,18.9 a 2.948,2.948 0 1 1 2.948,-2.948 2.951,2.951 0 0 1 -2.948,2.948 z" />
    {/* collaboration-mode letter */}
    <text x="11" y="26" fontSize="5.8" textAnchor="middle" fontFamily="Arial">
      {letter}
    </text>
  </svg>
);
