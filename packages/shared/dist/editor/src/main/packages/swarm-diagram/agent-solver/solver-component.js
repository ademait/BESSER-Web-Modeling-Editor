import React from 'react';
import { AgentGroupComponent } from '../agent-group/agent-group-component';
// Color: Green (#22c55e) for solvers
export const SolverComponent = ({ element, fillColor }) => {
    return React.createElement(AgentGroupComponent, { element: element, fillColor: fillColor });
};
//# sourceMappingURL=solver-component.js.map