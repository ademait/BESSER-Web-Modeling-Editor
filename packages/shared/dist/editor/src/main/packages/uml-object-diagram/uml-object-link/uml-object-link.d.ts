import { DeepPartial } from 'redux';
import { UMLRelationship } from '../../../services/uml-relationship/uml-relationship';
import * as Apollon from '../../../typings';
import { IUMLObjectLink } from '../../../typings';
export declare class UMLObjectLink extends UMLRelationship implements IUMLObjectLink {
    type: "ObjectLink";
    associationId?: string;
    constructor(values?: DeepPartial<IUMLObjectLink>);
    serialize(): Apollon.UMLRelationship & {
        associationId?: string;
    };
    deserialize<T extends Apollon.UMLModelElement>(values: T, children?: Apollon.UMLModelElement[]): void;
}
