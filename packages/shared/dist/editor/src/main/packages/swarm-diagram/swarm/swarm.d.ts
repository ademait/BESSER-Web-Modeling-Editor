import { DeepPartial } from 'redux';
import { IUMLContainer, UMLContainer } from '../../../services/uml-container/uml-container';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElementType } from '../../uml-element-type';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
import * as Apollon from '../../../typings';
export interface ISwarm extends IUMLContainer {
    framework: string;
}
export declare class Swarm extends UMLContainer implements ISwarm {
    static features: UMLElementFeatures;
    type: UMLElementType;
    framework: string;
    static HEADER_HEIGHT: number;
    static MIN_WIDTH: number;
    static MIN_HEIGHT: number;
    constructor(values?: DeepPartial<ISwarm>);
    serialize(children?: UMLElement[]): Apollon.Swarm;
    render(canvas: ILayer, children?: ILayoutable[]): ILayoutable[];
}
