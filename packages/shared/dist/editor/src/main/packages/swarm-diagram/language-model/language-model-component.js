import React from 'react';
import { Text } from '../../../components/controls/text/text';
import { ThemedRect } from '../../../components/theme/themedComponents';
export const LanguageModelComponent = ({ element, fillColor }) => {
    return (React.createElement("g", null,
        React.createElement(ThemedRect, { width: "100%", height: "100%", fillColor: fillColor || element.fillColor, strokeColor: element.strokeColor, rx: 3, strokeDasharray: "5,3" }),
        React.createElement("svg", { height: 25 },
            React.createElement(Text, { fill: element.textColor, fontWeight: "bold" }, element.name)),
        React.createElement("svg", { y: 28, height: 20 },
            React.createElement(Text, { fill: element.textColor, fontSize: "smaller" }, `${element.provider} / ${element.model}`))));
};
//# sourceMappingURL=language-model-component.js.map