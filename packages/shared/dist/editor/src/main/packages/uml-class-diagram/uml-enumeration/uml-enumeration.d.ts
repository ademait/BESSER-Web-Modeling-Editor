import { UMLClassifier } from '../../common/uml-classifier/uml-classifier';
import { UMLElementType } from '../../uml-element-type';
import { IUMLElement } from '../../../services/uml-element/uml-element';
import { UMLElementFeatures } from '../../../services/uml-element/uml-element-features';
export declare class UMLEnumeration extends UMLClassifier {
    type: UMLElementType;
    stereotype: string | null;
    static features: UMLElementFeatures;
    reorderChildren(children: IUMLElement[]): string[];
}
