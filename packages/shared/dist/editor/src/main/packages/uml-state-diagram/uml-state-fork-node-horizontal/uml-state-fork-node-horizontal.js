import { StateElementType, StateRelationshipType } from '..';
import { UMLElement } from '../../../services/uml-element/uml-element';
export class UMLStateForkNodeHorizontal extends UMLElement {
    constructor(values) {
        super(values);
        this.type = StateElementType.StateForkNodeHorizontal;
        this.bounds = {
            ...this.bounds,
        };
        this.bounds.width = (values && values.bounds && values.bounds.width) || UMLStateForkNodeHorizontal.defaultWidth;
        this.bounds.height = UMLStateForkNodeHorizontal.defaultHeight;
    }
    render(layer) {
        this.bounds.width = Math.max(this.bounds.width, UMLStateForkNodeHorizontal.defaultWidth);
        return [this];
    }
}
UMLStateForkNodeHorizontal.supportedRelationships = [StateRelationshipType.StateTransition];
UMLStateForkNodeHorizontal.features = { ...UMLElement.features, updatable: false };
UMLStateForkNodeHorizontal.defaultWidth = 60;
UMLStateForkNodeHorizontal.defaultHeight = 20;
//# sourceMappingURL=uml-state-fork-node-horizontal.js.map