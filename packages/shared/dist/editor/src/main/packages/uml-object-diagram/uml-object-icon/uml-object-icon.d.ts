import { UMLElementType } from '../../uml-element-type';
import { DeepPartial } from 'redux';
import * as Apollon from '../../../typings';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { IUMLElement } from '../../../services/uml-element/uml-element';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
export interface IUMLObjectAttribute extends IUMLElement {
    attributeId?: string;
}
export declare class UMLObjectIcon extends UMLElement {
    type: UMLElementType;
    icon?: string;
    static features: {
        hoverable: boolean;
        selectable: boolean;
        movable: boolean;
        connectable: boolean;
        droppable: boolean;
        updatable: boolean;
        resizable: boolean | "WIDTH" | "HEIGHT";
        alternativePortVisualization: boolean;
    };
    constructor(values?: DeepPartial<IUMLElement & {
        icon?: string;
    }>);
    serialize(): {
        icon: string | undefined;
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
        uri?: string;
        assessmentNote?: string;
    };
    deserialize<T extends Apollon.UMLModelElement>(values: T, children?: Apollon.UMLModelElement[]): void;
    render(layer: ILayer): ILayoutable[];
}
