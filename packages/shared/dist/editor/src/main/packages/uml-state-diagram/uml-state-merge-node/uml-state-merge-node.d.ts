import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { IBoundary } from '../../../utils/geometry/boundary';
export declare class UMLStateMergeNode extends UMLElement {
    static supportedRelationships: "StateTransition"[];
    type: "StateMergeNode";
    bounds: IBoundary;
    render(canvas: ILayer): ILayoutable[];
}
