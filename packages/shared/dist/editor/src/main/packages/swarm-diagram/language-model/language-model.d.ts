import { DeepPartial } from 'redux';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
import { UMLElementType } from '../../uml-element-type';
import { ILayoutable } from '../../../services/layouter/layoutable';
import { ILayer } from '../../../services/layouter/layer';
import * as Apollon from '../../../typings';
export interface ILanguageModel extends IUMLElement {
    provider: string;
    model: string;
    endpoint: string;
    temperature: number;
    maxTokens: number;
    apiKeySecret: string;
}
export declare class LanguageModel extends UMLElement implements ILanguageModel {
    static features: UMLElementFeatures;
    static MIN_WIDTH: number;
    static MIN_HEIGHT: number;
    type: UMLElementType;
    provider: string;
    model: string;
    endpoint: string;
    temperature: number;
    maxTokens: number;
    apiKeySecret: string;
    constructor(values?: DeepPartial<ILanguageModel>);
    serialize(): Apollon.LanguageModel;
    render(canvas: ILayer): ILayoutable[];
}
