import React from 'react';
import { Text } from '../../../components/controls/text/text';
import { ThemedRect } from '../../../components/theme/themedComponents';
export const AgentStateMemberComponent = ({ element, fillColor }) => {
    return (React.createElement("g", null,
        React.createElement(ThemedRect, { fillColor: fillColor || element.fillColor, strokeColor: "none", width: "100%", height: "100%" }),
        React.createElement(Text, { x: 10, fill: element.textColor, fontWeight: "normal", textAnchor: "start" }, element.name)));
};
//# sourceMappingURL=agent-state-member-component.js.map