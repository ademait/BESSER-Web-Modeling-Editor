import React from 'react';
import { ThemedPolyline } from '../../../components/theme/themedComponents';
export const UMLObjectLinkComponent = ({ element }) => (React.createElement("g", null,
    React.createElement(ThemedPolyline, { points: element.path.map((point) => `${point.x} ${point.y}`).join(','), strokeColor: element.strokeColor, fillColor: "none", strokeWidth: 2 })));
//# sourceMappingURL=uml-object-link-component.js.map