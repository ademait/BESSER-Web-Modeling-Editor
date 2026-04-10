import { UMLRelationshipCenteredDescription } from '../../../services/uml-relationship/uml-relationship-centered-description';
import * as Apollon from '../../../typings';
import { DeepPartial } from 'redux';
export interface IUMLStateTransition {
    params: {
        [id: string]: string;
    };
}
export declare class AgentStateTransitionInit extends UMLRelationshipCenteredDescription implements IUMLStateTransition {
    type: "AgentStateTransitionInit";
    params: {
        [id: string]: string;
    };
    constructor(values?: DeepPartial<Apollon.UMLStateTransition>);
    serialize(): Apollon.UMLStateTransition;
    deserialize<T extends Apollon.UMLModelElement>(values: T & {
        params?: string | string[] | {
            [id: string]: string;
        };
    }, children?: Apollon.UMLModelElement[]): void;
}
