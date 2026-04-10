import { UMLRelationship } from '../../../services/uml-relationship/uml-relationship';
import { SwarmRelationshipType } from '..';
export class SwarmLink extends UMLRelationship {
    constructor() {
        super(...arguments);
        this.type = SwarmRelationshipType.SwarmLink;
    }
}
//# sourceMappingURL=swarm-link.js.map