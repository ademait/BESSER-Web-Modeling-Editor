import React from 'react';
type Props = {
    onClick: any;
    colorEnabled?: boolean;
};
export declare function ColorButtonComponent({ onClick, colorEnabled }: Props): React.JSX.Element | null;
export declare const ColorButton: import("react-redux").ConnectedComponent<typeof ColorButtonComponent, import("react-redux").Omit<Props, never>>;
export {};
