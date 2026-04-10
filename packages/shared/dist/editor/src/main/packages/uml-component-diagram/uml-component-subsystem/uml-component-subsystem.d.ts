import { DeepPartial } from 'redux';
import { UMLPackage } from '../../common/uml-package/uml-package';
import { IUMLContainer } from '../../../services/uml-container/uml-container';
import * as Apollon from '../../../typings';
export interface IUMLSubsystem extends IUMLContainer {
    stereotype: string;
    displayStereotype: boolean;
}
export declare class UMLSubsystem extends UMLPackage implements IUMLSubsystem {
    static supportedRelationships: ("ComponentInterfaceProvided" | "ComponentInterfaceRequired" | "ComponentDependency")[];
    stereotype: string;
    displayStereotype: boolean;
    type: "Subsystem";
    constructor(values?: DeepPartial<IUMLSubsystem>);
    serialize(): Apollon.UMLComponentSubsystem;
    deserialize<T extends Apollon.UMLModelElement>(values: T, children?: Apollon.UMLModelElement[]): void;
}
