import { StateElementType, StateRelationshipType } from '..';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { calculateNameBounds } from '../../../utils/name-bounds';
export class UMLStateMergeNode extends UMLElement {
    constructor() {
        super(...arguments);
        this.type = StateElementType.StateMergeNode;
        this.bounds = { ...this.bounds };
    }
    render(canvas) {
        this.bounds = calculateNameBounds(this, canvas);
        return [this];
    }
}
UMLStateMergeNode.supportedRelationships = [StateRelationshipType.StateTransition];
//# sourceMappingURL=uml-state-merge-node.js.map