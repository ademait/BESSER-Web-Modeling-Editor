import React from 'react';
import { UMLClassifierMember } from './uml-classifier-member';
import { ModelState } from '../../../components/store/model-state';
interface OwnProps {
    element: UMLClassifierMember;
    fillColor?: string;
}
interface StateProps {
    elements: ModelState['elements'];
}
type Props = OwnProps & StateProps;
export declare const UMLClassifierMemberComponentIcon: import("react-redux").ConnectedComponent<React.FunctionComponent<Props>, import("react-redux").Omit<OwnProps & StateProps, "elements"> & OwnProps>;
export {};
