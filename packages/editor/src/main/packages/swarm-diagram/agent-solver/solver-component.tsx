import React, { FunctionComponent } from 'react';
import { Solver } from './solver';
import { AgentGroupComponent } from '../agent-group/agent-group-component';

interface Props {
  element: Solver;
  fillColor?: string;
}

// Color: Green (#22c55e) for solvers
export const SolverComponent: FunctionComponent<Props> = ({ element, fillColor }) => {
  return (
    <AgentGroupComponent
      element={element}
      fillColor={fillColor}  
    />
  );
};