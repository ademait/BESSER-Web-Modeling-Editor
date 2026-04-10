import { GeneralRelationshipType } from './general-relationship-type';
import { UMLAssociation } from '../uml-association/uml-association';
export class UMLLink extends UMLAssociation {
    constructor() {
        super(...arguments);
        this.type = GeneralRelationshipType.Link;
    }
}
//# sourceMappingURL=uml-link.js.map