import React, { FunctionComponent } from 'react';
interface Props extends React.SVGProps<SVGSVGElement> {
    fillColor?: string;
    strokeColor?: string;
}
/**
 * MOSAICO-style agent icon - a robot head with antenna, eyes, and smile
 * The head is filled with the agent's color, stroke for outlines
 */
export declare const AgentIcon: FunctionComponent<Props>;
export {};
