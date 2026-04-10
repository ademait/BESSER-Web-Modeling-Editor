import { DeepPartial } from 'redux';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { IBoundary } from '../../../utils/geometry/boundary';
import * as Apollon from '../../../typings';
export declare abstract class AgentStateMember extends UMLElement {
    static features: UMLElementFeatures;
    bounds: IBoundary;
    replyType: string;
    constructor(values?: DeepPartial<IUMLElement>);
    /** Serializes an `UMLElement` to an `Apollon.UMLElement` */
    serialize(children?: UMLElement[]): Apollon.AgentModelElement;
    deserialize<T extends Apollon.UMLModelElement>(values: T & {
        replyType: string;
    }): void;
    render(layer: ILayer): ILayoutable[];
}
