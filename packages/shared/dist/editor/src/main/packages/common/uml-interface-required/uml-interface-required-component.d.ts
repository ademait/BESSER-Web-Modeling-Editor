import React from 'react';
import { UMLInterfaceRequired } from './uml-interface-required';
type OwnProps = {
    element: UMLInterfaceRequired;
};
type StateProps = {
    hasOppositeRequiredInterface: boolean;
    currentRequiredInterfaces: UMLInterfaceRequired[];
    currentAllInterfaces: any;
};
type DispatchProps = {};
type Props = OwnProps & StateProps & DispatchProps;
export declare const UMLInterfaceRequiredComponent: import("react-redux").ConnectedComponent<React.FunctionComponent<Props>, import("react-redux").Omit<OwnProps & StateProps, "hasOppositeRequiredInterface" | "currentRequiredInterfaces" | "currentAllInterfaces"> & OwnProps>;
export {};
