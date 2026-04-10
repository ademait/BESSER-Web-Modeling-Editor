import React from 'react';
type Props = {
    color?: string;
    onColorChange: (hex: string | undefined) => void;
    open: boolean;
};
export declare function ColorSelector({ onColorChange, color, open }: Props): React.JSX.Element | null;
export {};
