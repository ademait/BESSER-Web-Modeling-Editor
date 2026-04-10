import { StateElementType, StateRelationshipType } from '..';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { calculateNameBounds } from '../../../utils/name-bounds';
export class UMLStateObjectNode extends UMLElement {
    constructor() {
        super(...arguments);
        this.type = StateElementType.StateObjectNode;
    }
    render(canvas) {
        this.bounds = calculateNameBounds(this, canvas);
        return [this];
    }
}
UMLStateObjectNode.supportedRelationships = [StateRelationshipType.StateTransition];
//# sourceMappingURL=uml-state-object-node.js.map