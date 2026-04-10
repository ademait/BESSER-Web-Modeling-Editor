import React, { Component } from 'react';
import { DeepPartial } from 'redux';
import { Styles } from './styles';
declare const defaultProps: {
    styles: DeepPartial<Styles>;
};
type Props = {
    children?: React.ReactChild;
} & typeof defaultProps;
export declare class Theme extends Component<Props> {
    static defaultProps: {
        styles: DeepPartial<Styles>;
    };
    theme: Styles;
    render(): React.JSX.Element;
}
export {};
