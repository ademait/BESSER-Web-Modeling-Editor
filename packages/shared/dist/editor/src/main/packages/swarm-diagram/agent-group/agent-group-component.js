import React from 'react';
import { Text } from '../../../components/controls/text/text';
import { AgentIcon } from '../common/icons';
export const AgentGroupComponent = ({ element, fillColor }) => {
    // To show the orphan appearance, we do this check, but maybe we have to improve it later
    // Preview elements have no owner AND are at default position (0,0)
    // Real orphan elements have been placed on canvas (non-origin position)
    const isLikelyPreview = !element.owner &&
        element.bounds.x === 0 &&
        element.bounds.y === 0;
    // Only show orphan styling for real elements (not previews)
    const isOrphan = !element.owner && !isLikelyPreview;
    // Use element's fill color or prop override
    const agentColor = fillColor || element.fillColor || '#ffffff';
    // Use red stroke for orphans to indicate invalid placement
    const strokeColor = isOrphan ? '#dc3545' : darkenColor(agentColor, 0.4); // Bootstrap danger red
    const strokeWidth = isOrphan ? 3 : 1;
    // Calculate text color for contrast
    const textColor = element.textColor || '#1f2937';
    // Icon dimensions (square aspect ratio for robot head)
    const iconSize = Math.min(element.bounds.width, element.bounds.height - 24) * 0.9;
    // Center the icon horizontally
    const iconX = (element.bounds.width - iconSize) / 2;
    const iconY = 2; // Small top padding
    // Calculate text position (below icon)
    const textY = iconY + iconSize + 4;
    return (React.createElement("g", null,
        React.createElement("rect", { width: element.bounds.width, height: element.bounds.height, fill: "transparent" }),
        React.createElement(AgentIcon, { x: iconX, y: iconY, width: iconSize, height: iconSize, fillColor: agentColor, strokeColor: strokeColor }),
        React.createElement("svg", { y: textY, width: element.bounds.width, height: 20 },
            React.createElement(Text, { fill: textColor, fontWeight: "bold", fontSize: "small", textAnchor: "middle", x: element.bounds.width / 2 }, element.name))));
};
/**
 * Helper function to darken a hex color
 */
function darkenColor(hex, factor) {
    // Remove # if present
    const color = hex.replace('#', '');
    // Parse RGB values
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    // Darken each component
    const darken = (c) => Math.round(c * (1 - factor));
    // Convert back to hex
    const toHex = (c) => c.toString(16).padStart(2, '0');
    return `#${toHex(darken(r))}${toHex(darken(g))}${toHex(darken(b))}`;
}
//# sourceMappingURL=agent-group-component.js.map