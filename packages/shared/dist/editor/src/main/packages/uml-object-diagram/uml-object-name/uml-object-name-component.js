import React from 'react';
import { Text } from '../../../components/controls/text/text';
import { ThemedPath, ThemedRect } from '../../../components/theme/themedComponents';
import { diagramBridge } from '../../../services/diagram-bridge/diagram-bridge-service';
import { settingsService } from '../../../services/settings/settings-service';
export const UMLObjectNameComponent = ({ element, children, fillColor }) => {
    // Helper function to get the class name from the classId
    const getClassName = () => {
        if (!element.classId) {
            return '';
        }
        const classInfo = diagramBridge.getClassById(element.classId);
        return classInfo ? classInfo.name : '';
    };
    const className = getClassName();
    // Check if we should show icon view or normal view
    const shouldShowIconView = settingsService.shouldShowIconView();
    if (shouldShowIconView) {
        return renderIconView(element, children, fillColor, className);
    }
    else {
        return renderNormalView(element, children, fillColor, className);
    }
};
const renderIconView = (element, children, fillColor, className) => {
    return (React.createElement("g", null,
        React.createElement(ThemedRect, { fillColor: fillColor || element.fillColor, strokeColor: "none", width: "100%", height: element.stereotype ? 50 : 40 }),
        React.createElement(ThemedRect, { y: element.stereotype ? 50 : 40, width: "100%", height: element.bounds.height - (element.stereotype ? 50 : 40), strokeColor: "none" }),
        React.createElement(ThemedPath, { d: `M 0 ${element.headerHeight} H ${element.bounds.width}`, strokeColor: element.strokeColor }),
        React.createElement("svg", { height: 40 },
            React.createElement(Text, { fill: element.textColor, fontStyle: element.italic ? 'italic' : undefined, textDecoration: element.underline ? 'underline' : undefined },
                element.name,
                className ? ` : ${className}` : '')),
        children,
        React.createElement(ThemedRect, { width: "100%", height: "100%", strokeColor: element.strokeColor, fillColor: "none", "pointer-events": "none" })));
};
const renderNormalView = (element, children, fillColor, className) => {
    return (React.createElement("g", null,
        React.createElement(ThemedRect, { fillColor: fillColor || element.fillColor, strokeColor: "none", width: "100%", height: element.stereotype ? 50 : 40 }),
        React.createElement(ThemedRect, { y: element.stereotype ? 50 : 40, width: "100%", height: element.bounds.height - (element.stereotype ? 50 : 40), strokeColor: "none" }),
        element.stereotype ? (React.createElement("svg", { height: 50 },
            React.createElement(Text, { fill: element.textColor },
                React.createElement("tspan", { x: "50%", dy: -8, textAnchor: "middle", fontSize: "85%" }, `«${element.stereotype}»`),
                React.createElement("tspan", { x: "50%", dy: 18, textAnchor: "middle", fontStyle: element.italic ? 'italic' : undefined, textDecoration: "underline" },
                    element.name,
                    className ? ` : ${className}` : '')))) : (React.createElement("svg", { height: 40 },
            React.createElement(Text, { fill: element.textColor, fontStyle: element.italic ? 'italic' : undefined, textDecoration: "underline" },
                element.name,
                className ? ` : ${className}` : ''))),
        children,
        React.createElement(ThemedRect, { width: "100%", height: "100%", strokeColor: element.strokeColor, fillColor: "none", "pointer-events": "none" }),
        element.hasAttributes && (React.createElement(ThemedPath, { d: `M 0 ${element.headerHeight} H ${element.bounds.width}`, strokeColor: element.strokeColor })),
        element.hasMethods && element.stereotype !== 'enumeration' && (React.createElement(ThemedPath, { d: `M 0 ${element.deviderPosition} H ${element.bounds.width}`, strokeColor: element.strokeColor }))));
};
//# sourceMappingURL=uml-object-name-component.js.map