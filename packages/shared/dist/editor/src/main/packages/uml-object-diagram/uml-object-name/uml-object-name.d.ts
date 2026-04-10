import { UMLClassifier, IUMLClassifier } from '../../common/uml-classifier/uml-classifier';
import { UMLElementType } from '../../uml-element-type';
import { IUMLElement, UMLElement } from '../../../services/uml-element/uml-element';
import { DeepPartial } from 'redux';
import * as Apollon from '../../../typings';
import { ILayer } from '../../../services/layouter/layer';
import { ILayoutable } from '../../../services/layouter/layoutable';
export interface IUMLObjectName extends IUMLClassifier {
    classId?: string;
    className?: string;
    icon?: string;
}
export declare class UMLObjectName extends UMLClassifier implements IUMLObjectName {
    type: UMLElementType;
    underline: boolean;
    classId?: string;
    className?: string;
    icon?: string;
    static supportedRelationships: ("ObjectLink" | "Link")[];
    constructor(values?: DeepPartial<IUMLObjectName>);
    serialize(children?: UMLElement[]): Apollon.UMLClassifier & {
        classId?: string;
        className?: string;
        icon?: string;
    };
    deserialize<T extends Apollon.UMLModelElement>(values: T, children?: Apollon.UMLModelElement[]): void;
    reorderChildren(children: IUMLElement[]): string[];
    private static extractSvgSize;
    private static setupIconBounds;
    private static finalizeBounds;
    render(layer: ILayer, children?: ILayoutable[]): ILayoutable[];
    private renderIconView;
    private renderNormalView;
    renderObject(layer: ILayer, children: ILayoutable[] | undefined, icon: ILayoutable): ILayoutable[];
}
