import React from 'react';
import { connect } from 'react-redux';
import { Text } from '../../../components/controls/text/text';
import { ThemedRect } from '../../../components/theme/themedComponents';
import { settingsService } from '../../../services/settings/settings-service';
import { ObjectElementType } from '../../uml-object-diagram';
const UMLClassifierMemberComponentUnconnected = ({ element, fillColor, elements }) => {
    // Check if this element's owner is an object and if icon view is enabled
    const owner = element.owner ? elements[element.owner] : null;
    const isObjectAttribute = element.type === ObjectElementType.ObjectAttribute;
    const isObjectMethod = element.type === ObjectElementType.ObjectMethod;
    const shouldShowIconView = settingsService.shouldShowIconView();
    // Hide attributes and methods in icon view for object diagrams
    if ((isObjectAttribute || isObjectMethod) && shouldShowIconView) {
        return null;
    }
    // Check if owner is enumeration
    const isEnumeration = owner && 'stereotype' in owner && owner.stereotype === 'enumeration';
    // Use displayName for class attributes/methods, fallback to name for others
    // For enumerations, only show the name (no visibility or type)
    const displayText = isEnumeration ? element.name : (element.displayName || element.name);
    return (React.createElement("g", null,
        React.createElement(ThemedRect, { fillColor: fillColor || element.fillColor, strokeColor: "none", width: "100%", height: "100%" }),
        React.createElement(Text, { x: 10, fill: element.textColor, fontWeight: "normal", textAnchor: "start" }, displayText)));
};
export const UMLClassifierMemberComponent = connect((state) => ({
    elements: state.elements,
}))(UMLClassifierMemberComponentUnconnected);
//# sourceMappingURL=uml-classifier-member-component.js.map