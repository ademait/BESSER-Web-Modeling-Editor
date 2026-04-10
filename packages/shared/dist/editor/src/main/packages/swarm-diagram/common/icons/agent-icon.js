import React from 'react';
/**
 * MOSAICO-style agent icon - a robot head with antenna, eyes, and smile
 * The head is filled with the agent's color, stroke for outlines
 */
export const AgentIcon = ({ fillColor = '#3b82f6', strokeColor = '#1e3a5f', ...props }) => (React.createElement("svg", { ...props, viewBox: "0 0 60 60", fill: "none" },
    React.createElement("line", { x1: "30", y1: "2", x2: "30", y2: "12", stroke: strokeColor, strokeWidth: "3", strokeLinecap: "round" }),
    React.createElement("circle", { cx: "30", cy: "5", r: "5", fill: fillColor, stroke: strokeColor, strokeWidth: "2" }),
    React.createElement("rect", { x: "2", y: "24", width: "6", height: "18", rx: "3", fill: fillColor, stroke: strokeColor, strokeWidth: "2" }),
    React.createElement("rect", { x: "52", y: "24", width: "6", height: "18", rx: "3", fill: fillColor, stroke: strokeColor, strokeWidth: "2" }),
    React.createElement("rect", { x: "8", y: "12", width: "44", height: "42", rx: "10", fill: fillColor, stroke: strokeColor, strokeWidth: "3" }),
    React.createElement("circle", { cx: "22", cy: "30", r: "7", fill: "white", stroke: strokeColor, strokeWidth: "2" }),
    React.createElement("circle", { cx: "22", cy: "30", r: "3", fill: strokeColor }),
    React.createElement("circle", { cx: "38", cy: "30", r: "7", fill: "white", stroke: strokeColor, strokeWidth: "2" }),
    React.createElement("circle", { cx: "38", cy: "30", r: "3", fill: strokeColor }),
    React.createElement("path", { d: "M 20 42 Q 30 50 40 42", fill: "none", stroke: strokeColor, strokeWidth: "2.5", strokeLinecap: "round" })));
//# sourceMappingURL=agent-icon.js.map