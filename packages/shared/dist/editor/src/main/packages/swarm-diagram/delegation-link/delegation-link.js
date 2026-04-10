import { UMLRelationship } from '../../../services/uml-relationship/uml-relationship';
import { SwarmRelationshipType } from '..';
/**
 * DelegationLink - Represents task delegation from one agent to another
 *
 * Typically used for:
 * - Dispatcher → Solver (delegating tasks)
 * - Any agent → Another agent (forwarding work)
 *
 * Visual: Solid blue arrow
 */
export class DelegationLink extends UMLRelationship {
    constructor(values) {
        super(values);
        this.type = SwarmRelationshipType.DelegationLink;
        // Default styling for delegation
        this.strokeColor = '#3b82f6'; // Blue
        this.name = values?.name ?? 'delegates';
        this.strokeColor = values?.strokeColor ?? '#3b82f6';
        this.delegationType = values?.delegationType;
    }
}
//# sourceMappingURL=delegation-link.js.map