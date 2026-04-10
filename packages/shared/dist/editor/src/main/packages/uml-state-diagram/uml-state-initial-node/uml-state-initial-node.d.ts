import { DeepPartial } from 'redux';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { IBoundary } from '../../../utils/geometry/boundary';
export declare class UMLStateInitialNode extends UMLElement {
    static supportedRelationships: ("StateTransition" | "AgentStateTransitionInit")[];
    static features: UMLElementFeatures;
    type: "StateInitialNode";
    bounds: IBoundary;
    constructor(values?: DeepPartial<IUMLElement>);
    render(canvas: ILayer): ILayoutable[];
}
