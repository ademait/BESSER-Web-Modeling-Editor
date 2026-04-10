import React from 'react';
// Evaluator icon - checkmark in circle (assessment/validation)
export const EvaluatorIcon = ({ color = 'currentColor', ...props }) => (React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
    React.createElement("path", { d: "M7 12 L10 15 L17 8" })));
//# sourceMappingURL=evaluator-icon.js.map