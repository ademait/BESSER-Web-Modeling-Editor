import { UMLPackage } from '../../common/uml-package/uml-package';
import { ComponentElementType, ComponentRelationshipType } from '..';
import { assign } from '../../../utils/fx/assign';
export class UMLSubsystem extends UMLPackage {
    constructor(values) {
        super();
        this.stereotype = 'subsystem';
        this.displayStereotype = true;
        this.type = ComponentElementType.Subsystem;
        assign(this, values);
    }
    serialize() {
        return {
            ...super.serialize(),
            type: this.type,
            stereotype: this.stereotype,
            displayStereotype: this.displayStereotype,
        };
    }
    deserialize(values, children) {
        const assert = (v) => v.type === ComponentElementType.Subsystem;
        if (!assert(values)) {
            return;
        }
        super.deserialize(values, children);
        this.stereotype = values.stereotype;
        this.displayStereotype = values.displayStereotype;
    }
}
UMLSubsystem.supportedRelationships = [
    ComponentRelationshipType.ComponentDependency,
    ComponentRelationshipType.ComponentInterfaceProvided,
    ComponentRelationshipType.ComponentInterfaceRequired,
];
//# sourceMappingURL=uml-component-subsystem.js.map