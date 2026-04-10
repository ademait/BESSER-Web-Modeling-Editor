import { StateElementType, StateRelationshipType } from '..';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { assign } from '../../../utils/fx/assign';
export class UMLStateFinalNode extends UMLElement {
    constructor(values) {
        super(values);
        this.type = StateElementType.StateFinalNode;
        this.bounds = { ...this.bounds, width: 50, height: 50 };
        assign(this, values);
    }
    render(canvas) {
        return [this];
    }
}
UMLStateFinalNode.supportedRelationships = [StateRelationshipType.StateTransition];
UMLStateFinalNode.features = { ...UMLElement.features, resizable: false, updatable: false };
//# sourceMappingURL=uml-state-final-node.js.map