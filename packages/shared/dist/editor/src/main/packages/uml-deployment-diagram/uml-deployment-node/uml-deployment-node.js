import { DeploymentElementType, DeploymentRelationshipType } from '..';
import { assign } from '../../../utils/fx/assign';
import { UMLPackage } from '../../common/uml-package/uml-package';
export class UMLDeploymentNode extends UMLPackage {
    constructor(values) {
        super();
        this.type = DeploymentElementType.DeploymentNode;
        this.stereotype = 'node';
        this.displayStereotype = true;
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
        const assert = (v) => v.type === DeploymentElementType.DeploymentNode;
        if (!assert(values)) {
            return;
        }
        super.deserialize(values, children);
        this.stereotype = values.stereotype;
        this.displayStereotype = values.displayStereotype;
    }
}
UMLDeploymentNode.supportedRelationships = [
    DeploymentRelationshipType.DeploymentAssociation,
    DeploymentRelationshipType.DeploymentDependency,
    DeploymentRelationshipType.DeploymentInterfaceProvided,
    DeploymentRelationshipType.DeploymentInterfaceRequired,
];
//# sourceMappingURL=uml-deployment-node.js.map