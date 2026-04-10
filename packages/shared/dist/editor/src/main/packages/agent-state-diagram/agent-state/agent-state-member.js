import { UMLElement } from '../../../services/uml-element/uml-element';
import { assign } from '../../../utils/fx/assign';
import { computeDimension } from '../../../utils/geometry/boundary';
import { Text } from '../../../utils/svg/text';
export class AgentStateMember extends UMLElement {
    constructor(values) {
        super(values);
        this.bounds = { ...this.bounds, height: computeDimension(1.0, 30) };
        this.replyType = "text";
        assign(this, values);
    }
    /** Serializes an `UMLElement` to an `Apollon.UMLElement` */
    serialize(children) {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            owner: this.owner,
            bounds: this.bounds,
            highlight: this.highlight,
            fillColor: this.fillColor,
            strokeColor: this.strokeColor,
            textColor: this.textColor,
            assessmentNote: this.assessmentNote,
            replyType: this.replyType,
        };
    }
    deserialize(values) {
        this.id = values.id;
        this.name = values.name;
        this.type = values.type;
        this.owner = values.owner || null;
        this.bounds = { ...values.bounds };
        this.highlight = values.highlight;
        this.fillColor = values.fillColor;
        this.strokeColor = values.strokeColor;
        this.textColor = values.textColor;
        this.assessmentNote = values.assessmentNote;
        this.replyType = values.replyType;
    }
    render(layer) {
        const radix = 10;
        const width = Text.size(layer, this.name).width + 20;
        this.bounds.width = Math.max(this.bounds.width, Math.round(width / radix) * radix);
        return [this];
    }
}
AgentStateMember.features = {
    ...UMLElement.features,
    hoverable: false,
    selectable: false,
    movable: false,
    resizable: false,
    connectable: false,
    droppable: false,
    updatable: false,
};
//# sourceMappingURL=agent-state-member.js.map