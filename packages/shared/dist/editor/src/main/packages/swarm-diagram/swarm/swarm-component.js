import React from 'react';
import { Text } from '../../../components/controls/text/text';
import { ThemedRect, ThemedPath } from '../../../components/theme/themedComponents';
import { Swarm } from './swarm';
export const SwarmComponent = ({ element, children, fillColor }) => {
    const headerHeight = Swarm.HEADER_HEIGHT;
    return (React.createElement("g", null,
        React.createElement(ThemedRect, { width: "100%", height: "100%", fillColor: fillColor || element.fillColor, strokeColor: element.strokeColor, strokeWidth: 2, rx: 10 }),
        React.createElement(ThemedRect, { width: "100%", height: headerHeight, fillColor: fillColor || element.fillColor, strokeColor: "none", rx: 10 }),
        React.createElement(ThemedPath, { d: `M 0 ${headerHeight} H ${element.bounds.width}`, strokeColor: element.strokeColor }),
        React.createElement("svg", { height: headerHeight },
            React.createElement(Text, { fill: element.textColor, fontWeight: "bold" }, element.name)),
        children));
};
//# sourceMappingURL=swarm-component.js.map