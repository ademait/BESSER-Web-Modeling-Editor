import { UMLElement } from '../../../services/uml-element/uml-element';
import { assign } from '../../../utils/fx/assign';
import { computeDimension } from '../../../utils/geometry/boundary';
import { Text } from '../../../utils/svg/text';
export class UMLStateMember extends UMLElement {
    constructor(values) {
        super(values);
        this.bounds = { ...this.bounds, height: computeDimension(1.0, 30) };
        assign(this, values);
    }
    render(layer) {
        const radix = 10;
        const width = Text.size(layer, this.name).width + 20;
        this.bounds.width = Math.max(this.bounds.width, Math.round(width / radix) * radix);
        return [this];
    }
}
UMLStateMember.features = {
    ...UMLElement.features,
    hoverable: false,
    selectable: false,
    movable: false,
    resizable: false,
    connectable: false,
    droppable: false,
    updatable: false,
};
//# sourceMappingURL=uml-state-member.js.map