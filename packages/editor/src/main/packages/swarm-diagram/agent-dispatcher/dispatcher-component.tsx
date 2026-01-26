import React, { FunctionComponent } from 'react';
import { Dispatcher } from './dispatcher';
import { AgentGroupComponent } from '../agent-group/agent-group-component';

interface Props {
  element: Dispatcher;
  fillColor?: string;
}

// Color: Blue (#3b82f6) for dispatchers
export const DispatcherComponent: FunctionComponent<Props> = ({ element, fillColor }) => {
  return (
    <AgentGroupComponent
      element={element}
      fillColor={fillColor} 
    />
  );
};