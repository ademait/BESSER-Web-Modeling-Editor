import React from 'react';
import { AgentGroupComponent } from '../agent-group/agent-group-component';
// Color: Orange (#f59e0b) for evaluators
export const EvaluatorComponent = ({ element, fillColor }) => {
    // Color is already set in element.fillColor via constructor
    return React.createElement(AgentGroupComponent, { element: element, fillColor: fillColor });
};
//# sourceMappingURL=evaluator-component.js.map