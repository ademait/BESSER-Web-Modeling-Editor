import { DeepPartial } from 'redux';
import { IUMLContainer } from '../../../services/uml-container/uml-container';
import * as Apollon from '../../../typings';
import { UMLPackage } from '../../common/uml-package/uml-package';
import { UMLElementType } from '../../uml-element-type';
export interface IUMLDeploymentNode extends IUMLContainer {
    stereotype: string;
    displayStereotype: boolean;
}
export declare class UMLDeploymentNode extends UMLPackage implements IUMLDeploymentNode {
    static supportedRelationships: ("DeploymentAssociation" | "DeploymentInterfaceProvided" | "DeploymentInterfaceRequired" | "DeploymentDependency")[];
    type: UMLElementType;
    stereotype: string;
    displayStereotype: boolean;
    constructor(values?: DeepPartial<IUMLDeploymentNode>);
    serialize(): Apollon.UMLDeploymentNode;
    deserialize<T extends Apollon.UMLModelElement>(values: T, children?: Apollon.UMLModelElement[]): void;
}
