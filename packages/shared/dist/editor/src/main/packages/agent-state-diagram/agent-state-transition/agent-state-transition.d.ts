import { UMLRelationshipCenteredDescription } from '../../../services/uml-relationship/uml-relationship-centered-description';
import * as Apollon from '../../../typings';
import { DeepPartial } from 'redux';
export interface IUMLStateTransition {
    params: {
        [id: string]: string;
    };
}
export declare class AgentStateTransition extends UMLRelationshipCenteredDescription implements IUMLStateTransition {
    type: "AgentStateTransition";
    params: {
        [id: string]: string;
    };
    condition: string | undefined;
    intentName: string | undefined;
    variable: string | undefined;
    operator: string | undefined;
    targetValue: string | undefined;
    fileType: string | undefined;
    constructor(values?: DeepPartial<Apollon.AgentStateTransition>);
    serialize(): Apollon.AgentStateTransition;
    deserialize<T extends Apollon.UMLModelElement>(values: T & {
        params?: string | string[] | {
            [id: string]: string;
        };
    } & {
        condition?: string;
    } & {
        conditionValue?: string | {
            variable: string;
            operator: string;
            targetValue: string;
        };
    } & {
        fileType?: string;
    }, children?: Apollon.UMLModelElement[]): void;
}
