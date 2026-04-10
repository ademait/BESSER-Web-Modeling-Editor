import { ComponentType } from 'react';
import { ConnectedComponent } from 'react-redux';
import { UMLElementRepository } from '../../../services/uml-element/uml-element-repository';
import { AsyncDispatch } from '../../../utils/actions/actions';
import { UMLSubsystem } from './uml-component-subsystem';
type OwnProps = {
    element: UMLSubsystem;
};
type StateProps = {};
type DispatchProps = {
    update: typeof UMLElementRepository.update;
    delete: AsyncDispatch<typeof UMLElementRepository.delete>;
};
type Props = OwnProps & StateProps & DispatchProps;
export declare const UMLComponentSubsystemUpdate: ConnectedComponent<ComponentType<Props>, OwnProps>;
export {};
