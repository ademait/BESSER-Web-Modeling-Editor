import { ClassElementType } from '..';
import { UMLClassifier } from '../../common/uml-classifier/uml-classifier';
import { ClassRelationshipType } from '..';
import { GeneralRelationshipType } from '../../uml-relationship-type';
export class UMLClass extends UMLClassifier {
    constructor() {
        super(...arguments);
        this.type = ClassElementType.Class;
    }
    reorderChildren(children) {
        const attributes = children.filter((x) => x.type === ClassElementType.ClassAttribute);
        const methods = children.filter((x) => x.type === ClassElementType.ClassMethod);
        return [...attributes.map((element) => element.id), ...methods.map((element) => element.id)];
    }
}
UMLClass.supportedRelationships = [
    ClassRelationshipType.ClassBidirectional,
    ClassRelationshipType.ClassOCLLink,
    GeneralRelationshipType.Link,
    ClassRelationshipType.ClassAggregation,
    ClassRelationshipType.ClassDependency,
    ClassRelationshipType.ClassComposition,
    ClassRelationshipType.ClassUnidirectional,
    ClassRelationshipType.ClassInheritance,
    ClassRelationshipType.ClassRealization,
];
//# sourceMappingURL=uml-class.js.map