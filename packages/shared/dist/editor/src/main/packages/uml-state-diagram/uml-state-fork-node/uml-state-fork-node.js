import { StateElementType, StateRelationshipType } from '..';
import { UMLElement } from '../../../services/uml-element/uml-element';
export class UMLStateForkNode extends UMLElement {
    constructor(values) {
        super(values);
        this.type = StateElementType.StateForkNode;
        this.bounds = {
            ...this.bounds,
        };
        this.bounds.height = (values && values.bounds && values.bounds.height) || UMLStateForkNode.defaultHeight;
        this.bounds.width = UMLStateForkNode.defaultWidth;
    }
    render(layer) {
        this.bounds.height = Math.max(this.bounds.height, UMLStateForkNode.defaultHeight);
        return [this];
    }
}
UMLStateForkNode.supportedRelationships = [StateRelationshipType.StateTransition];
UMLStateForkNode.features = { ...UMLElement.features, updatable: false };
UMLStateForkNode.defaultWidth = 20;
UMLStateForkNode.defaultHeight = 60;
//# sourceMappingURL=uml-state-fork-node.js.map