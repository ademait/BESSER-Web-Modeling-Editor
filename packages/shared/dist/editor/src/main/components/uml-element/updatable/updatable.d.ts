import { ComponentType } from 'react';
import { ConnectedComponent } from 'react-redux';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { AsyncDispatch } from '../../../utils/actions/actions';
import { UMLElementComponentProps } from '../uml-element-component-props';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { AssociationPopup } from '../../../services/uml-element/connectable/association-popup-repository';
type StateProps = {
    hovered: boolean;
    selected: boolean;
    isObjectDiagram: boolean;
};
type DispatchProps = {
    updateStart: AsyncDispatch<typeof UMLElementRepository.updateStart>;
    deleteElement: AsyncDispatch<typeof UMLElementRepository.delete>;
    openAssociationPopup: AsyncDispatch<typeof AssociationPopup.open>;
    getElementById: (id: string) => UMLElement | null;
    getRelationshipById: (id: string) => UMLElement | null;
};
type Props = UMLElementComponentProps & StateProps & DispatchProps;
export declare const updatable: (WrappedComponent: ComponentType<UMLElementComponentProps>) => ConnectedComponent<ComponentType<Props>, UMLElementComponentProps>;
export {};
