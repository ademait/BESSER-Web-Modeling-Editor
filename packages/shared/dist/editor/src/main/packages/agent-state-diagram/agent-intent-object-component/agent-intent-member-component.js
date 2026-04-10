import React from 'react';
import { Text } from '../../../components/controls/text/text';
import { ThemedRect } from '../../../components/theme/themedComponents';
export const AgentIntentMemberComponent = ({ element, fillColor }) => {
    return (React.createElement("g", null,
        React.createElement(ThemedRect, { fillColor: 'none', strokeColor: "none", width: "100%", height: "100%" }),
        React.createElement(Text, { x: 10, fill: 'black', fontWeight: "normal", textAnchor: "start" }, element.name)));
};
//# sourceMappingURL=agent-intent-member-component.js.map