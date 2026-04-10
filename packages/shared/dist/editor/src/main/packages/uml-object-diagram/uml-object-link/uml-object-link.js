import { ObjectRelationshipType } from '..';
import { UMLRelationship } from '../../../services/uml-relationship/uml-relationship';
export class UMLObjectLink extends UMLRelationship {
    constructor(values) {
        super(values);
        this.type = ObjectRelationshipType.ObjectLink;
        if (values?.associationId) {
            this.associationId = values.associationId;
        }
    }
    serialize() {
        return {
            ...super.serialize(),
            associationId: this.associationId,
        };
    }
    deserialize(values, children) {
        super.deserialize(values, children);
        if ('associationId' in values && typeof values.associationId === 'string') {
            this.associationId = values.associationId;
        }
    }
}
//# sourceMappingURL=uml-object-link.js.map