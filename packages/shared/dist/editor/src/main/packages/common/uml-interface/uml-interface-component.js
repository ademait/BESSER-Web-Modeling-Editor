import React from 'react';
import { Text } from '../../../components/controls/text/text';
import { ThemedCircle } from '../../../components/theme/themedComponents';
export const UMLInterfaceComponent = ({ element, fillColor }) => (React.createElement("g", null,
    React.createElement(ThemedCircle, { cx: "50%", cy: "50%", r: 10, strokeColor: element.strokeColor, strokeWidth: 2, fillColor: fillColor || element.fillColor }),
    React.createElement(Text, { x: 25, noY: true, dominantBaseline: "auto", textAnchor: "start", fill: element.textColor }, element.name)));
//# sourceMappingURL=uml-interface-component.js.map