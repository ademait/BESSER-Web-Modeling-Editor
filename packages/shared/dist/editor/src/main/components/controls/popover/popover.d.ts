import React, { HTMLAttributes, ReactNode } from 'react';
export type Props = {
    children?: ReactNode;
    placement?: 'top' | 'right' | 'bottom' | 'left';
    alignment?: 'start' | 'center' | 'end';
    position: {
        x: number;
        y: number;
    };
    maxHeight?: number;
    style?: React.CSSProperties;
    onMouseDown?: (event: React.MouseEvent) => void;
    onMouseMove?: (event: React.MouseEvent) => void;
} & HTMLAttributes<HTMLDivElement>;
export declare const Popover: React.ForwardRefExoticComponent<{
    children?: ReactNode;
    placement?: "top" | "right" | "bottom" | "left";
    alignment?: "start" | "center" | "end";
    position: {
        x: number;
        y: number;
    };
    maxHeight?: number;
    style?: React.CSSProperties;
    onMouseDown?: (event: React.MouseEvent) => void;
    onMouseMove?: (event: React.MouseEvent) => void;
} & React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
