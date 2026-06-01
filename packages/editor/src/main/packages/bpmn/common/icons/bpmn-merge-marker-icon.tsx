import React, { FunctionComponent } from 'react';

// Agentic BPMN merge marker for merging gateways (SEAA'25 paper §4.4): two bars
// with arrows pointing inward (flows merging) and the merging-strategy label
// (e.g. v-ma, r-l, c-f) below. Clean-vector port of
// .claude/bpmn/examples/merge-competition-fastest.svg.
//
// Used on merging agentic gateways; diverging gateways use
// BPMNCollaborationMarkerIcon. The label is unchanged from MERGING_TWO_LETTER.
export const BPMNMergeMarkerIcon: FunctionComponent<React.SVGProps<SVGSVGElement> & { letter: string }> = ({
  letter,
  ...props
}) => (
  <svg
    {...props}
    width={16}
    height={20}
    viewBox="0 0 18 23"
    fill="none"
    stroke="currentColor"
    strokeWidth={0.93}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* two bars with inward-pointing arrows (merge) */}
    <path d="M 1,15 V 1 M 17,15 V 1 m -1,7 h -5 m 0,0 2,-2 m -2,2 2,2 M 2,8 H 7 M 7,8 5,10 M 7,8 5,6" />
    {/* merging-strategy label */}
    {/* The global `text { font-size }` rule (scenes/svg-styles.ts) overrides the
        SVG fontSize attribute, so size MUST be set via inline style. Diverging
        (collaboration) renders the same 16px at ×0.727; this marker scales ×0.87,
        so ~13.4px here matches it on screen. */}
    <text x="9" y="22" style={{ fontSize: '13px' }} fill="currentColor" stroke="none" textAnchor="middle">
      {letter}
    </text>
  </svg>
);
