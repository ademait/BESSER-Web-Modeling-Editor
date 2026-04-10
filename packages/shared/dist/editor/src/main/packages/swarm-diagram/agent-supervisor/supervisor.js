import { AgentGroup } from '../agent-group/agent-group';
import { SwarmElementType } from '..';
import { SwarmRelationshipType } from '..';
export class Supervisor extends AgentGroup {
    constructor(values) {
        super(values);
        this.type = SwarmElementType.Supervisor;
        this.name = values?.name ?? 'Supervisor';
        this.role = values?.role ?? 'supervisor';
        this.fillColor = values?.fillColor ?? '#ef4444';
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
Supervisor.supportedRelationships = [
    SwarmRelationshipType.SupervisionLink,
    SwarmRelationshipType.SwarmLink,
];
//# sourceMappingURL=supervisor.js.map