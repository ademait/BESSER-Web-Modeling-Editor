import React from 'react';
import { ThemedRect } from '../../../components/theme/themedComponents';
// Preserves tabs when displaying code
const preserveTabs = (str) => {
    return str.replace(/\t/g, '    ');
};
const escapeHtml = (str) => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};
const CodeContent = ({ content, textColor }) => {
    const fontSize = '13px';
    const paddingLeft = 10;
    const lineHeight = 14;
    const renderCodeLines = () => {
        const lines = content.split('\n');
        return lines.map((line, index) => {
            const y = 20 + (index * lineHeight);
            const processedLine = preserveTabs(line);
            return (React.createElement("foreignObject", { key: index, x: 0, y: y, width: "100%", height: lineHeight },
                React.createElement("div", { style: {
                        fontSize,
                        color: textColor,
                        fontFamily: 'monospace',
                        whiteSpace: 'pre',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        paddingLeft: paddingLeft,
                        width: '100%',
                    } }, processedLine)));
        });
    };
    return (React.createElement("g", null,
        React.createElement("foreignObject", { x: 0, y: 20, width: "100%", height: "calc(100% - 20px)" },
            React.createElement("div", { style: {
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    position: 'relative'
                } }, renderCodeLines()))));
};
export const UMLStateCodeBlockComponent = ({ element, fillColor }) => {
    const cornerRadius = 8;
    const headerHeight = 20;
    const contentCode = element.code || '';
    return (React.createElement("g", null,
        React.createElement(ThemedRect, { width: "100%", height: "100%", fillColor: fillColor || element.fillColor, strokeColor: element.strokeColor, rx: cornerRadius }),
        React.createElement(ThemedRect, { width: "100%", height: headerHeight, fillColor: element.strokeColor, strokeColor: element.strokeColor, rx: cornerRadius, ry: cornerRadius }),
        React.createElement("text", { x: 10, y: headerHeight / 2 + 5, fontSize: "10px", fontFamily: "sans-serif", fill: "#fff", fontWeight: "bold" }, "Python"),
        React.createElement(CodeContent, { content: contentCode, textColor: element.textColor || '#000' })));
};
//# sourceMappingURL=uml-state-code-block-component.js.map