import { ObjectElementType } from '..';
import { UMLElement } from '../../../services/uml-element/uml-element';
export class UMLObjectIcon extends UMLElement {
    constructor(values) {
        super(values);
        this.type = ObjectElementType.ObjectIcon;
        if (values?.icon) {
            this.icon = values.icon;
        }
    }
    serialize() {
        return {
            ...super.serialize(),
            icon: this.icon,
        };
    }
    deserialize(values, children) {
        super.deserialize(values, children);
        if ('icon' in values && typeof values.icon === 'string') {
            this.icon = values.icon;
        }
    }
    render(layer) {
        const radix = 10;
        const width = 20;
        this.bounds.width = Math.max(this.bounds.width, Math.round(width / radix) * radix);
        return [this];
    }
}
UMLObjectIcon.features = {
    ...UMLElement.features,
    hoverable: false,
    selectable: false,
    movable: false,
    connectable: false,
    droppable: false,
    updatable: false,
};
//# sourceMappingURL=uml-object-icon.js.map