import React, { FunctionComponent } from 'react';
import { Supervisor } from './supervisor';
import { AgentGroupComponent } from '../agent-group/agent-group-component';

interface Props {
  element: Supervisor;
  fillColor?: string;
}

// Color: Gray (#6b7280) for supervisors
export const SupervisorComponent: FunctionComponent<Props> = ({ element, fillColor }) => {
  return <AgentGroupComponent element={element} fillColor={fillColor} />;
};