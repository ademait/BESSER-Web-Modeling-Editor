import { DeepPartial } from 'redux';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { IBoundary } from '../../../utils/geometry/boundary';
import * as Apollon from '../../../typings';
export type Visibility = 'public' | 'private' | 'protected' | 'package';
export interface IUMLClassifierMember extends IUMLElement {
    code?: string;
    visibility?: Visibility;
    attributeType?: string;
}
export declare abstract class UMLClassifierMember extends UMLElement implements IUMLClassifierMember {
    static features: UMLElementFeatures;
    bounds: IBoundary;
    code: string;
    visibility: Visibility;
    attributeType: string;
    constructor(values?: DeepPartial<IUMLClassifierMember>);
    /**
     * Get the display name for rendering (combines visibility symbol, name, and type)
     */
    get displayName(): string;
    /**
     * Parse legacy name format and extract visibility, name, and attributeType
     * Used for backward compatibility when loading old diagrams
     */
    static parseNameFormat(name: string): {
        visibility: Visibility;
        name: string;
        attributeType: string;
    };
    /** Serializes an `UMLClassifierMember` to an `Apollon.UMLModelElement` */
    serialize(children?: UMLElement[]): Apollon.UMLModelElement;
    /** Deserializes an `Apollon.UMLModelElement` to an `UMLClassifierMember` */
    deserialize<T extends Apollon.UMLModelElement>(values: T, children?: Apollon.UMLModelElement[]): void;
    render(layer: ILayer): ILayoutable[];
}
