import React, { FunctionComponent } from 'react';
import { BPMNGateway } from './bpmn-gateway';
import { BPMNEventBasedGatewayComponent } from './gateways-components/bpmn-event-based-gateway-component';
import { BPMNExclusiveGatewayComponent } from './gateways-components/bpmn-exclusive-gateway-component';
import { BPMNInclusiveGatewayComponent } from './gateways-components/bpmn-inclusive-gateway-component';
import { BPMNParallelGatewayComponent } from './gateways-components/bpmn-parallel-gateway-component';
import { BPMNComplexGatewayComponent } from './gateways-components/bpmn-complex-gateway-component';
import { BPMNCollaborationMode, BPMNMergingStrategy } from '../common/types';

// Agentic BPMN (04D1 — paper §4.4 / Table 2). Diverging gateways show a single-
// letter collaboration marker; merging gateways show a two-letter strategy
// marker. Shared by the parallel + inclusive components.
export const COLLAB_LETTER: Record<BPMNCollaborationMode, string> = {
  voting: 'v',
  role: 'r',
  debate: 'd',
  competition: 'c',
};

export const MERGING_TWO_LETTER: Record<BPMNMergingStrategy, string> = {
  majority: 'v-ma',
  'absolute-majority': 'v-a',
  minority: 'v-mi',
  'leader-driven': 'r-l',
  composed: 'r-c',
  fastest: 'c-f',
  'most-complete': 'c-mc',
};

export const BPMNGatewayComponent: FunctionComponent<Props> = (props) => {
  let GatewayComponent = BPMNExclusiveGatewayComponent;

  switch (props.element.gatewayType) {
    case 'complex':
      GatewayComponent = BPMNComplexGatewayComponent;
      break;
    case 'event-based':
      GatewayComponent = BPMNEventBasedGatewayComponent;
      break;
    case 'exclusive':
      GatewayComponent = BPMNExclusiveGatewayComponent;
      break;
    case 'inclusive':
      GatewayComponent = BPMNInclusiveGatewayComponent;
      break;
    case 'parallel':
      GatewayComponent = BPMNParallelGatewayComponent;
      break;
  }

  return (
    <g>
      <GatewayComponent {...props} />
    </g>
  );
};

export interface Props {
  element: BPMNGateway;
  fillColor?: string;
}
