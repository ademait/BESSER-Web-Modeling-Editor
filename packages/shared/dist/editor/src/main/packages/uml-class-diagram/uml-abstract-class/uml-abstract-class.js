import { ClassElementType } from '..';
import { UMLClassifier } from '../../common/uml-classifier/uml-classifier';
import { ClassRelationshipType } from '..';
export class UMLAbstractClass extends UMLClassifier {
    constructor() {
        super(...arguments);
        this.type = ClassElementType.AbstractClass;
        this.italic = true;
        this.stereotype = 'abstract';
    }
    reorderChildren(children) {
        const attributes = children.filter((x) => x.type === ClassElementType.ClassAttribute);
        const methods = children.filter((x) => x.type === ClassElementType.ClassMethod);
        return [...attributes.map((element) => element.id), ...methods.map((element) => element.id)];
    }
}
UMLAbstractClass.supportedRelationships = [
    ClassRelationshipType.ClassBidirectional,
    ClassRelationshipType.ClassOCLLink,
    ClassRelationshipType.ClassAggregation,
    ClassRelationshipType.ClassDependency,
    ClassRelationshipType.ClassComposition,
    ClassRelationshipType.ClassUnidirectional,
    ClassRelationshipType.ClassInheritance,
    ClassRelationshipType.ClassRealization,
];
//# sourceMappingURL=uml-abstract-class.js.map