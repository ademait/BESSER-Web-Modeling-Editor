import { StateElementType, StateRelationshipType } from '..';
import { UMLElement } from '../../../services/uml-element/uml-element';
import { assign } from '../../../utils/fx/assign';
import { AgentRelationshipType } from '../../agent-state-diagram/';
export class UMLStateInitialNode extends UMLElement {
    constructor(values) {
        super(values);
        this.type = StateElementType.StateInitialNode;
        this.bounds = { ...this.bounds, width: 50, height: 50 };
        assign(this, values);
    }
    render(canvas) {
        return [this];
    }
}
UMLStateInitialNode.supportedRelationships = [AgentRelationshipType.AgentStateTransitionInit, StateRelationshipType.StateTransition];
UMLStateInitialNode.features = { ...UMLElement.features, resizable: false, updatable: false };
//# sourceMappingURL=uml-state-initial-node.js.map