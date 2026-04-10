import { UMLRelationship } from '../../../services/uml-relationship/uml-relationship';
import { SwarmRelationshipType } from '..';
/**
 * SupervisionLink - Represents oversight/monitoring relationship
 *
 * Typically used for:
 * - Supervisor → Any agent (monitoring/coordinating)
 * - Manager → Team members
 *
 * Visual: Dashed gray arrow
 */
export class SupervisionLink extends UMLRelationship {
    constructor(values) {
        super(values);
        this.type = SwarmRelationshipType.SupervisionLink;
        // Default styling for supervision
        this.strokeColor = '#6b7280'; // Gray
        this.name = values?.name ?? 'supervises';
        this.strokeColor = values?.strokeColor ?? '#6b7280';
        this.supervisionLevel = values?.supervisionLevel;
    }
}
//# sourceMappingURL=supervision-link.js.map