import { ObjectElementType } from '..';
import { UMLClassifierAttribute } from '../../common/uml-classifier/uml-classifier-attribute';
export class UMLObjectAttribute extends UMLClassifierAttribute {
    constructor(values) {
        super(values);
        this.type = ObjectElementType.ObjectAttribute;
        if (values?.attributeId) {
            this.attributeId = values.attributeId;
        }
        // attributeType is already handled by the parent class constructor via assign()
    }
    serialize() {
        return {
            ...super.serialize(),
            attributeId: this.attributeId,
        };
    }
    deserialize(values, children) {
        super.deserialize(values, children);
        if ('attributeId' in values && typeof values.attributeId === 'string') {
            this.attributeId = values.attributeId;
        }
    }
}
//# sourceMappingURL=uml-object-attribute.js.map