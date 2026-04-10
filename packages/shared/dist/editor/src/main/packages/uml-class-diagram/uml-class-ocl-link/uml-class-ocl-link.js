import { ClassRelationshipType } from '..';
import { UMLAssociation } from '../../common/uml-association/uml-association';
export class UMLClassOCLLink extends UMLAssociation {
    constructor() {
        super(...arguments);
        this.type = ClassRelationshipType.ClassOCLLink;
    }
}
//# sourceMappingURL=uml-class-ocl-link.js.map