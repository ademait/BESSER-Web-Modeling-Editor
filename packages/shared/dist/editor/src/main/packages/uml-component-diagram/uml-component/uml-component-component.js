import { ComponentElementType, ComponentRelationshipType } from '..';
import { UMLComponent } from '../../common/uml-component/uml-component';
import { assign } from '../../../utils/fx/assign';
export class UMLComponentComponent extends UMLComponent {
    constructor(values) {
        super();
        this.type = ComponentElementType.Component;
        assign(this, values);
    }
    serialize() {
        return {
            ...super.serialize(),
            type: this.type,
            displayStereotype: this.displayStereotype,
        };
    }
    deserialize(values, children) {
        const assert = (v) => v.type === ComponentElementType.Component;
        if (!assert(values)) {
            return;
        }
        super.deserialize(values, children);
        this.displayStereotype = values.displayStereotype;
    }
}
UMLComponentComponent.supportedRelationships = [
    ComponentRelationshipType.ComponentDependency,
    ComponentRelationshipType.ComponentInterfaceProvided,
    ComponentRelationshipType.ComponentInterfaceRequired,
];
//# sourceMappingURL=uml-component-component.js.map