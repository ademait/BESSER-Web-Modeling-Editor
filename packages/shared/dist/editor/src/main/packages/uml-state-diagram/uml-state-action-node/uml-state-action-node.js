import { StateElementType, StateRelationshipType } from '..';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { calculateNameBounds } from '../../../utils/name-bounds';
export class UMLStateActionNode extends UMLElement {
    constructor() {
        super(...arguments);
        this.type = StateElementType.StateActionNode;
    }
    render(canvas) {
        this.bounds = calculateNameBounds(this, canvas);
        return [this];
    }
}
UMLStateActionNode.supportedRelationships = [StateRelationshipType.StateTransition];
//# sourceMappingURL=uml-state-action-node.js.map