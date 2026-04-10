import { UMLClassifierAttribute } from '../../common/uml-classifier/uml-classifier-attribute';
import { UMLElementType } from '../../uml-element-type';
import { DeepPartial } from 'redux';
import * as Apollon from '../../../typings';
import { IUMLElement } from '../../../services/uml-element/uml-element';
export interface IUMLObjectAttribute extends IUMLElement {
    attributeId?: string;
    attributeType?: string;
}
export declare class UMLObjectAttribute extends UMLClassifierAttribute {
    type: UMLElementType;
    attributeId?: string;
    constructor(values?: DeepPartial<IUMLElement & {
        attributeId?: string;
        attributeType?: string;
    }>);
    serialize(): {
        attributeId: string | undefined;
        id: string;
        name: string;
        type: Apollon.UMLModelElementType;
        owner: string | null;
        bounds: import("../../../utils/geometry/boundary").IBoundary;
        highlight?: string;
        fillColor?: string;
        strokeColor?: string;
        textColor?: string;
        description?: string;
        icon?: string;
        uri?: string;
        assessmentNote?: string;
    };
    deserialize<T extends Apollon.UMLModelElement>(values: T, children?: Apollon.UMLModelElement[]): void;
}
