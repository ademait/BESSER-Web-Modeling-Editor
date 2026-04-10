import { AgentGroup } from '../agent-group/agent-group';
import { SwarmElementType } from '..';
import { SwarmRelationshipType } from '..';
export class Dispatcher extends AgentGroup {
    constructor(values) {
        super(values);
        this.type = SwarmElementType.Dispatcher;
        this.name = values?.name ?? 'Dispatcher';
        this.role = values?.role ?? 'dispatcher';
        this.fillColor = values?.fillColor ?? '#3b82f6';
        // Update default bounds for robot head icon-style rendering
        this.bounds = {
            x: 0,
            y: 0,
            width: 60,
            height: 80,
            ...values?.bounds,
        };
    }
}
Dispatcher.supportedRelationships = [
    SwarmRelationshipType.DelegationLink,
    SwarmRelationshipType.SwarmLink,
    SwarmRelationshipType.SupervisionLink,
];
//# sourceMappingURL=dispatcher.js.map