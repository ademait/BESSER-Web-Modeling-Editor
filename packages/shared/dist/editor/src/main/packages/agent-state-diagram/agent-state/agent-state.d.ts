import { DeepPartial } from 'redux';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { IUMLContainer, UMLContainer } from '../../../services/uml-container/uml-container';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import * as Apollon from '../../../typings';
import { UMLElementType } from '../../uml-element-type';
export interface IUMLState extends IUMLContainer {
    italic: boolean;
    underline: boolean;
    stereotype: string | null;
    dividerPosition: number;
    hasBody: boolean;
    hasFallbackBody: boolean;
}
export declare class AgentState extends UMLContainer implements IUMLState {
    static features: UMLElementFeatures;
    static stereotypeHeaderHeight: number;
    static nonStereotypeHeaderHeight: number;
    static supportedRelationships: ("AgentStateTransition" | "AgentStateTransitionInit" | "Link")[];
    type: UMLElementType;
    italic: boolean;
    underline: boolean;
    stereotype: string | null;
    dividerPosition: number;
    hasBody: boolean;
    hasFallbackBody: boolean;
    get headerHeight(): number;
    constructor(values?: DeepPartial<IUMLState>);
    reorderChildren(children: IUMLElement[]): string[];
    serialize(children?: UMLElement[]): Apollon.UMLState;
    render(layer: ILayer, children?: ILayoutable[]): ILayoutable[];
}
