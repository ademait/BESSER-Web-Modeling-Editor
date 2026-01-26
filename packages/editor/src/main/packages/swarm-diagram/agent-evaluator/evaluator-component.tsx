import React, { FunctionComponent } from 'react';
import { Evaluator } from './evaluator';
import { AgentGroupComponent } from '../agent-group/agent-group-component';

interface Props {
  element: Evaluator;
  fillColor?: string;
}

// Color: Orange (#f59e0b) for evaluators
export const EvaluatorComponent: FunctionComponent<Props> = ({ element, fillColor }) => {
  return (
    <AgentGroupComponent
      element={element}
      fillColor={fillColor}
    />
  );
};