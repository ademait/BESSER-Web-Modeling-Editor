import React from 'react';
// Dispatcher icon - routing/branching arrows (fork pattern)
export const DispatcherIcon = ({ color = 'currentColor', ...props }) => (React.createElement("svg", { ...props, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M4 12 L10 12" }),
    React.createElement("circle", { cx: "12", cy: "12", r: "2", fill: color }),
    React.createElement("path", { d: "M14 12 L20 6" }),
    React.createElement("path", { d: "M14 12 L20 12" }),
    React.createElement("path", { d: "M14 12 L20 18" }),
    React.createElement("path", { d: "M18 4 L20 6 L18 8" }),
    React.createElement("path", { d: "M18 10 L20 12 L18 14" }),
    React.createElement("path", { d: "M18 16 L20 18 L18 20" })));
//# sourceMappingURL=dispatcher-icon.js.map