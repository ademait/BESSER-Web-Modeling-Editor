import { IUMLComponent, UMLComponent } from '../../common/uml-component/uml-component';
import { DeepPartial } from 'redux';
import * as Apollon from '../../../typings';
export declare class UMLComponentComponent extends UMLComponent {
    static supportedRelationships: ("ComponentInterfaceProvided" | "ComponentInterfaceRequired" | "ComponentDependency")[];
    type: "Component";
    constructor(values?: DeepPartial<IUMLComponent>);
    serialize(): Apollon.UMLComponentComponent;
    deserialize<T extends Apollon.UMLModelElement>(values: T, children?: Apollon.UMLModelElement[]): void;
}
