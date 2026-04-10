import { UMLClassifier } from '../../common/uml-classifier/uml-classifier';
import { UMLElementType } from '../../uml-element-type';
import { IUMLElement } from '../../../services/uml-element/uml-element';
export declare class UMLClass extends UMLClassifier {
    type: UMLElementType;
    static supportedRelationships: ("ClassBidirectional" | "ClassUnidirectional" | "ClassInheritance" | "ClassRealization" | "ClassDependency" | "ClassAggregation" | "ClassComposition" | "ClassOCLLink" | "Link")[];
    reorderChildren(children: IUMLElement[]): string[];
}
