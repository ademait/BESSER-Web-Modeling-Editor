import { DeepPartial } from 'redux';
import { IUMLComponent } from '../../common/uml-component/uml-component';
import * as Apollon from '../../../typings';
import { UMLComponent } from '../../common/uml-component/uml-component';
export declare class UMLDeploymentComponent extends UMLComponent {
    static supportedRelationships: ("DeploymentAssociation" | "DeploymentInterfaceProvided" | "DeploymentInterfaceRequired" | "DeploymentDependency")[];
    type: "DeploymentComponent";
    constructor(values?: DeepPartial<IUMLComponent>);
    serialize(): Apollon.UMLDeploymentComponent;
    deserialize<T extends Apollon.UMLModelElement>(values: T, children?: Apollon.UMLModelElement[]): void;
}
