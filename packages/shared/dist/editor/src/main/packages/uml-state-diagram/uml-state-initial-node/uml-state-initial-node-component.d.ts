import React from 'react';
import { UMLStateInitialNode } from './uml-state-initial-node';
import { ConnectedComponent } from 'react-redux';
import { withThemeProps } from '../../../components/theme/styles';
type OwnProps = {
    element: UMLStateInitialNode;
};
type StateProps = {
    interactive: boolean;
    interactable: boolean;
};
type DispatchProps = {};
type Props = OwnProps & StateProps & DispatchProps & withThemeProps;
export declare const UMLStateInitialNodeComponent: ConnectedComponent<React.ComponentType<Props>, OwnProps>;
export {};
