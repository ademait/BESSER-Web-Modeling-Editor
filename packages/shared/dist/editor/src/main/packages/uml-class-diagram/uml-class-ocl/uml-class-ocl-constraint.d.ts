import { DeepPartial } from 'redux';
import { UMLElementType } from '../../uml-element-type';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
export interface IUMLClassOCLConstraint extends IUMLElement {
    constraint: string;
}
export declare class ClassOCLConstraint extends UMLElement implements IUMLClassOCLConstraint {
    static supportedRelationships: "ClassOCLLink"[];
    type: UMLElementType;
    constraint: string;
    private static readonly MIN_WIDTH;
    private static readonly MIN_HEIGHT;
    private static readonly PADDING;
    constructor(values?: DeepPartial<IUMLClassOCLConstraint>);
    serialize(): {
        constraint: string;
        id: string;
        name: string;
        type: import("../../..").UMLModelElementType;
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
    deserialize(values: any): void;
    private wrapText;
    private adjustSizeToContent;
    render(canvas: ILayer): ILayoutable[];
}
