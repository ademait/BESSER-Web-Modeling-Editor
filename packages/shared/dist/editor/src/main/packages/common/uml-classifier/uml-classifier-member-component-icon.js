import React from 'react';
import { connect } from 'react-redux';
import { ThemedRect } from '../../../components/theme/themedComponents';
import { settingsService } from '../../../services/settings/settings-service';
import { ObjectElementType } from '../../uml-object-diagram';
const getIconWidth = (svgString) => {
    if (!svgString)
        return 0;
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, "image/svg+xml");
        const svg = doc.querySelector("svg");
        if (!svg)
            return 0;
        // Try `width` attribute first
        const widthAttr = svg.getAttribute("width");
        if (widthAttr) {
            const match = widthAttr.match(/[\d.]+/);
            return match ? parseFloat(match[0]) : 0;
        }
        // Fallback: extract width from viewBox
        const viewBox = svg.getAttribute("viewBox");
        if (viewBox) {
            const parts = viewBox.trim().split(/\s+/);
            return parts.length === 4 ? parseFloat(parts[2]) : 0;
        }
        return 0;
    }
    catch {
        return 0;
    }
};
const UMLClassifierMemberComponentIconUnconnected = ({ element, fillColor, elements }) => {
    // Check if this is an ObjectIcon and if icon view is enabled
    const isObjectIcon = element.type === ObjectElementType.ObjectIcon;
    const shouldShowIconView = settingsService.shouldShowIconView();
    // Icons should only be visible in icon view mode, hidden in normal view
    if (isObjectIcon && !shouldShowIconView) {
        return null;
    }
    // If this is not an ObjectIcon, don't render anything
    if (!isObjectIcon) {
        return null;
    }
    // Check if the icon content is valid before processing
    const iconContent = element.icon;
    if (!iconContent || typeof iconContent !== 'string' || iconContent.trim() === '') {
        return null;
    }
    // Set your icon width here, or extract it from the SVG if dynamic
    const iconWidth = getIconWidth(iconContent);
    return (React.createElement("g", null,
        React.createElement(ThemedRect, { fillColor: fillColor || element.fillColor, strokeColor: "none", width: "100%", height: "100%" }),
        iconContent && (React.createElement("g", { transform: `translate(${(element.bounds.width - iconWidth) / 2})`, dangerouslySetInnerHTML: { __html: iconContent } }))));
};
export const UMLClassifierMemberComponentIcon = connect((state) => ({
    elements: state.elements,
}))(UMLClassifierMemberComponentIconUnconnected);
//# sourceMappingURL=uml-classifier-member-component-icon.js.map