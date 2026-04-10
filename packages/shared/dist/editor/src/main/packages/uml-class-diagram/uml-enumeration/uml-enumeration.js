import { ClassElementType } from '..';
import { UMLClassifier } from '../../common/uml-classifier/uml-classifier';
import { UMLContainer } from '../../../services/uml-container/uml-container';
export class UMLEnumeration extends UMLClassifier {
    constructor() {
        super(...arguments);
        this.type = ClassElementType.Enumeration;
        this.stereotype = 'enumeration';
    }
    reorderChildren(children) {
        const attributes = children.filter((x) => x.type === ClassElementType.ClassAttribute);
        const methods = children.filter((x) => x.type === ClassElementType.ClassMethod);
        return [...attributes.map((element) => element.id), ...methods.map((element) => element.id)];
    }
}
UMLEnumeration.features = {
    ...UMLContainer.features,
    connectable: false,
};
//# sourceMappingURL=uml-enumeration.js.map