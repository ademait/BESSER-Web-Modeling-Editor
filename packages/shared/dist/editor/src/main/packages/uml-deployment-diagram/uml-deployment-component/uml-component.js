import { DeploymentElementType, DeploymentRelationshipType } from '..';
import { assign } from '../../../utils/fx/assign';
import { UMLComponent } from '../../common/uml-component/uml-component';
export class UMLDeploymentComponent extends UMLComponent {
    constructor(values) {
        super();
        this.type = DeploymentElementType.DeploymentComponent;
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
        const assert = (v) => v.type === DeploymentElementType.DeploymentComponent;
        if (!assert(values)) {
            return;
        }
        super.deserialize(values, children);
        this.displayStereotype = values.displayStereotype;
    }
}
UMLDeploymentComponent.supportedRelationships = [
    DeploymentRelationshipType.DeploymentAssociation,
    DeploymentRelationshipType.DeploymentDependency,
    DeploymentRelationshipType.DeploymentInterfaceProvided,
    DeploymentRelationshipType.DeploymentInterfaceRequired,
];
//# sourceMappingURL=uml-component.js.map