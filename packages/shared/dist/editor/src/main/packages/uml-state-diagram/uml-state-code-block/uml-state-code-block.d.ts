import { DeepPartial } from 'redux';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { IBoundary } from '../../../utils/geometry/boundary';
import { UMLElementType } from '../../uml-element-type';
export interface IUMLStateCodeBlock extends IUMLElement {
    code: string;
    language: string;
    _codeContent?: string;
}
export declare class UMLStateCodeBlock extends UMLElement implements IUMLStateCodeBlock {
    static supportedRelationships: "StateTransition"[];
    static features: UMLElementFeatures;
    type: UMLElementType;
    code: string;
    language: string;
    _codeContent?: string;
    bounds: IBoundary;
    constructor(values?: DeepPartial<IUMLStateCodeBlock>);
    render(canvas: ILayer): ILayoutable[];
    serialize(): any;
    deserialize(values: any): void;
}
